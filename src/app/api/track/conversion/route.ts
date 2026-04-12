import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { checkAndEscalateTier } from '@/lib/tier-escalation';

/**
 * POST /api/track/conversion - Track conversions/sales
 */
export async function POST(req: NextRequest) {
  try {
    const apiKey = req.headers.get('X-API-Key') || req.headers.get('x-api-key');
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 401 }
      );
    }

    // Verify API key
    const integration = await prisma.integrationSettings.findFirst({
      where: {
        publicKey: apiKey,
        isActive: true,
      },
    });

    if (!integration) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive API key' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      referralCode,
      customerEmail,
      customerName,
      amount,
      currency,
      orderId,
      metadata,
      url,
      timestamp,
    } = body;

    // If no referral code provided, fall back to the program's default partner code
    // (super admin's code — tracks organic signups without paying commission)
    let resolvedCode = referralCode;
    if (!resolvedCode) {
      const settings = await prisma.programSettings.findFirst();
      resolvedCode = settings?.defaultPartnerCode ?? null;
    }

    if (!resolvedCode) {
      return NextResponse.json(
        { success: false, error: 'Referral code is required' },
        { status: 400 }
      );
    }

    // Find affiliate by referral code
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode: resolvedCode },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    });

    if (!affiliate) {
      return NextResponse.json(
        { success: false, error: 'Invalid referral code' },
        { status: 404 }
      );
    }

    // Admin (super partner) earns 0% commission — used only for organic tracking
    const isAdminPartner = affiliate.user.role === 'ADMIN';

    if (affiliate.user.status !== 'ACTIVE') {
      return NextResponse.json(
        { success: false, error: 'Affiliate is not active' },
        { status: 403 }
      );
    }

    // Attribution lock: if this email already has an approved referral under a
    // DIFFERENT partner, preserve the original attribution — do not re-attribute.
    if (customerEmail) {
      const existingAttribution = await prisma.referral.findFirst({
        where: {
          leadEmail: customerEmail,
          status: { in: ['APPROVED', 'CONVERTED'] },
          NOT: { affiliateId: affiliate.id },
        },
      });
      if (existingAttribution) {
        console.log(`🔒 Attribution locked for ${customerEmail} (existing partner preserved)`);
        return NextResponse.json({
          success: true,
          message: 'Conversion tracked (existing attribution preserved)',
          attribution_locked: true,
        });
      }
    }

    // Check if referral with this email already exists
    let referral;
    if (customerEmail) {
      referral = await prisma.referral.findFirst({
        where: {
          leadEmail: customerEmail,
          affiliateId: affiliate.id,
        },
      });
    }

    // Create referral if doesn't exist
    if (!referral && customerEmail) {
      referral = await prisma.referral.create({
        data: {
          leadEmail: customerEmail,
          leadName: customerName || 'Unknown Customer',
          affiliateId: affiliate.id,
          status: 'APPROVED',
          metadata: metadata || {},
        },
      });
    } else if (referral && referral.status === 'PENDING') {
      // Update referral status to APPROVED
      referral = await prisma.referral.update({
        where: { id: referral.id },
        data: {
          status: 'APPROVED',
          metadata: {
            ...(referral.metadata as object),
            ...metadata,
          },
        },
      });
    }

    // Create conversion record
    // Admin partners (super admin default) are tracked but earn 0% commission
    const amountCents = Math.round((amount || 0) * 100);

    const conversion = await prisma.conversion.create({
      data: {
        affiliateId: affiliate.id,
        referralId: referral?.id || null,
        eventType: 'PURCHASE',
        amountCents,
        currency: currency || 'USD',
        // Admin partner conversions are marked APPROVED immediately with no commission payout
        status: isAdminPartner ? 'APPROVED' : 'PENDING',
        eventMetadata: {
          orderId: orderId || null,
          url: url || null,
          timestamp: timestamp || new Date().toISOString(),
          is_organic: isAdminPartner,  // flag for analytics: organic vs partner-referred
          ...metadata,
        },
      },
    });

    // Commission calculation is handled by commission rules system.
    // Admin-attributed conversions are excluded from commission payouts (is_organic flag).

    // Tier escalation only applies to non-admin partners
    // Check and auto-escalate partner tier — skip for admin (not a real partner tier)
    if (!isAdminPartner) {
      const tierResult = await checkAndEscalateTier(affiliate.id).catch((err) => {
        console.warn('Tier escalation check failed (non-fatal):', err.message);
        return null;
      });
      if (tierResult?.promoted) {
        console.log(`⬆️  Tier promotion: ${affiliate.user.email} → ${tierResult.newTier} (was ${tierResult.previousTier})`);
      }
    }

    console.log('✅ Conversion tracked successfully:', {
      conversionId: conversion.id,
      affiliateId: affiliate.id,
      referralId: referral?.id,
      amount: amountCents / 100,
    });

    return NextResponse.json({
      success: true,
      message: 'Conversion tracked successfully',
      conversion: {
        id: conversion.id,
        amount: amountCents / 100,
        currency: conversion.currency,
      },
      affiliate: {
        name: affiliate.user.name,
        code: affiliate.referralCode,
      },
    });
  } catch (error) {
    console.error('POST /api/track/conversion error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to track conversion' },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key',
    },
  });
}
