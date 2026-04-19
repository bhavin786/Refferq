/**
 * prisma/seeds/example-hotel.ts
 *
 * Generic seed for a hotel / subscription-based Refferq deployment.
 *
 * All values are driven by environment variables so this file contains
 * zero brand-specific strings and is safe to commit to the upstream repo.
 *
 * Required env vars (set in .env or deployment environment):
 *   PROGRAM_ID            — unique slug for this program (e.g. "main")
 *   PROGRAM_NAME          — display name shown in the partner portal
 *   PRODUCT_NAME          — the product / service being sold
 *   COMPANY_NAME          — legal / brand company name
 *   WEBSITE_URL           — public website of the business
 *   PORTAL_SUBDOMAIN      — subdomain for the partner portal
 *   CURRENCY              — ISO 4217 code, defaults to "INR"
 *   PAYOUT_METHODS        — JSON array string, defaults to '["UPI_BANK"]'
 *                           Example values: '["UPI_BANK"]', '["PAYPAL","BANK_TRANSFER"]'
 *                           For hotel/subscription deployments with manual bank/UPI payouts:
 *                           set PAYOUT_METHODS='["UPI_BANK"]'
 *   SOURCE_TAG            — identifies this deployment instance (e.g. "hotel-main")
 *   DEFAULT_PARTNER_CODE  — fallback referral code for organic signups (optional)
 *
 * Tier configuration (commission rates stored as decimals, e.g. 0.20 = 20%):
 *   TIER_1_NAME           — defaults to "Standard"
 *   TIER_1_RATE           — decimal, defaults to "0.20" (20%)
 *   TIER_1_THRESHOLD      — min active referrals to enter tier; defaults to "0" (entry tier)
 *   TIER_2_NAME           — defaults to "Silver"
 *   TIER_2_RATE           — decimal, defaults to "0.25" (25%)
 *   TIER_2_THRESHOLD      — defaults to "10"
 *   TIER_3_NAME           — defaults to "Gold"
 *   TIER_3_RATE           — decimal, defaults to "0.30" (30%)
 *   TIER_3_THRESHOLD      — defaults to "25"
 *
 * Safe to run multiple times — all writes are upserts keyed on stable identifiers.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── Helpers ────────────────────────────────────────────────────────────────

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined || value === '') {
    throw new Error(
      `[example-hotel seed] Missing required env var: ${name}. ` +
        `Set it in .env or pass it to the seed command.`,
    );
  }
  return value;
}

function envFloat(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseFloat(raw);
  if (isNaN(n)) throw new Error(`[example-hotel seed] ${name} must be a number, got: ${raw}`);
  return n;
}

function envInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = parseInt(raw, 10);
  if (isNaN(n)) throw new Error(`[example-hotel seed] ${name} must be an integer, got: ${raw}`);
  return n;
}

function envJson<T>(name: string, fallback: T): T {
  const raw = process.env[name];
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    throw new Error(`[example-hotel seed] ${name} must be valid JSON, got: ${raw}`);
  }
}

// ─── Seed ────────────────────────────────────────────────────────────────────

export async function seedExampleHotel() {
  console.log('[example-hotel] Seeding ProgramSettings...');

  // ── ProgramSettings ──────────────────────────────────────────────────────
  // payoutMethods is DB-driven; deployments choose their preferred method via
  // the PAYOUT_METHODS env var (JSON array). Hotel/subscription deployments
  // typically use '["UPI_BANK"]' for manual bank/UPI transfer payouts.
  // No code change is needed to switch methods — update DB via this seed or
  // the admin settings UI.

  const programId = requireEnv('PROGRAM_ID', 'main');

  await prisma.programSettings.upsert({
    where: { programId },
    update: {
      programName: requireEnv('PROGRAM_NAME', 'Partner Program'),
      productName: requireEnv('PRODUCT_NAME', 'Subscription'),
      companyName: process.env.COMPANY_NAME ?? null,
      websiteUrl: requireEnv('WEBSITE_URL', 'https://example.com'),
      portalSubdomain: requireEnv('PORTAL_SUBDOMAIN', 'partners'),
      currency: process.env.CURRENCY ?? 'INR',
      sourceTag: process.env.SOURCE_TAG ?? 'default',
      defaultPartnerCode: process.env.DEFAULT_PARTNER_CODE ?? null,
      payoutMethods: envJson<string[]>('PAYOUT_METHODS', ['UPI_BANK']),
    },
    create: {
      programId,
      programName: requireEnv('PROGRAM_NAME', 'Partner Program'),
      productName: requireEnv('PRODUCT_NAME', 'Subscription'),
      companyName: process.env.COMPANY_NAME ?? null,
      websiteUrl: requireEnv('WEBSITE_URL', 'https://example.com'),
      portalSubdomain: requireEnv('PORTAL_SUBDOMAIN', 'partners'),
      currency: process.env.CURRENCY ?? 'INR',
      sourceTag: process.env.SOURCE_TAG ?? 'default',
      defaultPartnerCode: process.env.DEFAULT_PARTNER_CODE ?? null,
      payoutMethods: envJson<string[]>('PAYOUT_METHODS', ['UPI_BANK']),
    },
  });

  console.log('[example-hotel] Seeding PartnerGroups (3 tiers)...');

  // ── PartnerGroups (tiers) ────────────────────────────────────────────────
  // Each tier is upserted by name. If names change, old rows are left in place.
  // Rates stored as decimals: 0.20 = 20%.

  const tiers = [
    {
      name: process.env.TIER_1_NAME ?? 'Standard',
      description: process.env.TIER_1_DESC ?? 'Entry-level partner tier',
      commissionRate: envFloat('TIER_1_RATE', 0.20),
      tierThreshold: envInt('TIER_1_THRESHOLD', 0),   // 0 = entry tier, no minimum
      isDefault: true,
    },
    {
      name: process.env.TIER_2_NAME ?? 'Silver',
      description: process.env.TIER_2_DESC ?? 'Mid-level partner tier',
      commissionRate: envFloat('TIER_2_RATE', 0.25),
      tierThreshold: envInt('TIER_2_THRESHOLD', 10),
      isDefault: false,
    },
    {
      name: process.env.TIER_3_NAME ?? 'Gold',
      description: process.env.TIER_3_DESC ?? 'Top-level partner tier',
      commissionRate: envFloat('TIER_3_RATE', 0.30),
      tierThreshold: envInt('TIER_3_THRESHOLD', 25),
      isDefault: false,
    },
  ];

  for (const tier of tiers) {
    const existing = await prisma.partnerGroup.findFirst({
      where: { name: tier.name },
    });

    if (existing) {
      await prisma.partnerGroup.update({
        where: { id: existing.id },
        data: {
          description: tier.description,
          commissionRate: tier.commissionRate,
          tierThreshold: tier.tierThreshold === 0 ? null : tier.tierThreshold,
          isDefault: tier.isDefault,
        },
      });
      console.log(`[example-hotel]   Updated tier: ${tier.name} (${tier.commissionRate * 100}%)`);
    } else {
      await prisma.partnerGroup.create({
        data: {
          name: tier.name,
          description: tier.description,
          commissionRate: tier.commissionRate,
          tierThreshold: tier.tierThreshold === 0 ? null : tier.tierThreshold,
          isDefault: tier.isDefault,
        },
      });
      console.log(`[example-hotel]   Created tier: ${tier.name} (${tier.commissionRate * 100}%)`);
    }
  }

  console.log('[example-hotel] Done.');
}

// ─── Standalone entrypoint ───────────────────────────────────────────────────
// Run directly:  npx ts-node prisma/seeds/example-hotel.ts
// Or via main seed.ts (see prisma/seed.ts).

if (require.main === module) {
  seedExampleHotel()
    .catch((e) => {
      console.error(e);
      process.exit(1);
    })
    .finally(() => prisma.$disconnect());
}
