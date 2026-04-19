import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { prisma } from '@/lib/prisma';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Verify HMAC-SHA256 from x-webhook-signature header (accepts raw hex or "sha256=<hex>"). */
function verifySignature(body: string, signature: string, secret: string): boolean {
  try {
    const expected = createHmac('sha256', secret).update(body).digest('hex');
    const sigHex = signature.replace(/^sha256=/, '');
    const expectedBuf = Buffer.from(expected, 'hex');
    const actualBuf = Buffer.from(sigHex, 'hex');
    if (expectedBuf.length !== actualBuf.length) return false;
    return timingSafeEqual(expectedBuf, actualBuf);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// POST /api/external/conversion
// ---------------------------------------------------------------------------
// Called by an integrated product after a successful purchase / subscription.
// Auth: HMAC-SHA256 over raw request body using WEBHOOK_SECRET env var.
//
// Request body (JSON):
//   referral_code    string  — affiliate referral code
//   customer_email   string  — purchasing customer's email
//   order_value      number  — order amount in major currency units (e.g. 99.00)
//   idempotency_key  string  — caller-supplied unique key; re-submits are safe
//   source_tag?      string  — optional label (e.g. "checkout", "upgrade")
//   currency?        string  — ISO 4217, defaults to "INR"
//   event_type?      string  — SIGNUP | PURCHASE | TRIAL | LEAD; defaults to "PURCHASE"
//
// Response 201: { status: "created",   conversion_id: string }
// Response 200: { status: "already_processed", conversion_id: string }
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  // ── 1. Verify HMAC signature ──────────────────────────────────────────────
  const signature = req.headers.get('x-webhook-signature') ?? '';
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('POST /api/external/conversion: WEBHOOK_SECRET not configured');
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const rawBody = await req.text();

  if (!verifySignature(rawBody, signature, webhookSecret)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // ── 2. Parse & validate body ──────────────────────────────────────────────
  let body: {
    referral_code: string;
    customer_email: string;
    order_value: number;
    idempotency_key: string;
    source_tag?: string;
    currency?: string;
    event_type?: string;
  };

  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const {
    referral_code,
    customer_email,
    order_value,
    idempotency_key,
    source_tag,
    currency,
    event_type,
  } = body;

  if (!referral_code || !customer_email || order_value == null || !idempotency_key) {
    return NextResponse.json(
      {
        error:
          'Missing required fields: referral_code, customer_email, order_value, idempotency_key',
      },
      { status: 400 },
    );
  }

  const allowedEventTypes = ['SIGNUP', 'PURCHASE', 'TRIAL', 'LEAD'] as const;
  type ValidEventType = (typeof allowedEventTypes)[number];

  const resolvedEventType: ValidEventType =
    allowedEventTypes.includes((event_type ?? '').toUpperCase() as ValidEventType)
      ? ((event_type!.toUpperCase()) as ValidEventType)
      : 'PURCHASE';

  // ── 3. Idempotency — check for existing conversion with same key ──────────
  // The Conversion model stores idempotency_key inside eventMetadata JSON.
  const existing = await prisma.conversion.findFirst({
    where: {
      eventMetadata: {
        path: ['idempotency_key'],
        equals: idempotency_key,
      },
    },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json(
      { status: 'already_processed', conversion_id: existing.id },
      { status: 200 },
    );
  }

  // ── 4. Look up affiliate by referral code ─────────────────────────────────
  const affiliate = await prisma.affiliate.findUnique({
    where: { referralCode: referral_code },
    include: { user: { select: { email: true, status: true } } },
  });

  if (!affiliate) {
    return NextResponse.json({ error: 'Invalid referral code' }, { status: 404 });
  }

  // ── 5. Self-referral guard ────────────────────────────────────────────────
  if (affiliate.user?.email?.toLowerCase() === customer_email.toLowerCase()) {
    return NextResponse.json({ error: 'Self-referral not allowed' }, { status: 422 });
  }

  // ── 6. Convert order_value (major units) → cents ──────────────────────────
  const amountCents = Math.round(order_value * 100);

  // ── 7. Create conversion record ───────────────────────────────────────────
  // customer_email, idempotency_key, and source_tag live in eventMetadata
  // because the Conversion model has no dedicated columns for them.
  const conversion = await prisma.conversion.create({
    data: {
      affiliateId: affiliate.id,
      eventType: resolvedEventType,
      amountCents,
      currency: (currency ?? 'INR').toUpperCase(),
      status: 'PENDING',
      eventMetadata: {
        customer_email,
        idempotency_key,
        source_tag: source_tag ?? 'default',
      },
    },
  });

  return NextResponse.json(
    { status: 'created', conversion_id: conversion.id },
    { status: 201 },
  );
}
