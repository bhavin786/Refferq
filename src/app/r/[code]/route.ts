import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const referralCode = code;
    const searchParams = request.nextUrl.searchParams;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com';
    const targetUrl = searchParams.get('target') || appUrl;

    // Find affiliate by referral code using Prisma
    const affiliate = await prisma.affiliate.findUnique({
      where: { referralCode },
      include: { user: true }
    });

    if (!affiliate) {
      // Invalid referral code - redirect to default URL
      return NextResponse.redirect(targetUrl);
    }

    // Get client IP and user agent
    const clientIP = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    '127.0.0.1';
    const userAgent = request.headers.get('user-agent') || 'Unknown';
    const referer = request.headers.get('referer') || null;

    // Generate attribution key
    const attributionKey = `attr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Find or create a referral record for click tracking
    let referral = await prisma.referral.findFirst({
      where: {
        affiliateId: affiliate.id,
        leadEmail: `click-${attributionKey}@tracking.internal`,
      }
    });

    if (!referral) {
      referral = await prisma.referral.create({
        data: {
          affiliateId: affiliate.id,
          leadName: 'Click Visitor',
          leadEmail: `click-${attributionKey}@tracking.internal`,
          status: 'PENDING',
          metadata: {
            source: 'referral_link',
            attribution_key: attributionKey,
            target_url: targetUrl,
          }
        }
      });
    }

    // Track the click in ReferralClick table
    await prisma.referralClick.create({
      data: {
        referralId: referral.id,
        ipAddress: clientIP.split(',')[0].trim(),
        userAgent: userAgent,
        referer: referer,
        metadata: {
          attribution_key: attributionKey,
          target_url: targetUrl,
        }
      }
    });

    // Create redirect response with attribution cookie
    const redirectUrl = new URL(targetUrl);
    redirectUrl.searchParams.set('ref', referralCode);
    redirectUrl.searchParams.set('attr', attributionKey);

    const response = NextResponse.redirect(redirectUrl.toString());

    // Set attribution cookie (expires in 30 days)
    const cookieExpiry = new Date();
    cookieExpiry.setDate(cookieExpiry.getDate() + 30);

    response.cookies.set('affiliate_attribution', JSON.stringify({
      referral_code: referralCode,
      attribution_key: attributionKey,
      affiliate_id: affiliate.id,
      timestamp: new Date().toISOString(),
    }), {
      expires: cookieExpiry,
      httpOnly: false, // Allow client-side access for conversion tracking
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error('Referral tracking error:', error);

    // Fallback redirect on error
    const targetUrl = request.nextUrl.searchParams.get('target') || process.env.NEXT_PUBLIC_APP_URL || 'https://app.refferq.com';
    return NextResponse.redirect(targetUrl);
  }
}