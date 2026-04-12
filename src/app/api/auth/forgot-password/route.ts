import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email';
import { checkRateLimit } from '@/lib/rate-limit';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 requests per 15 minutes per IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const rateLimit = await checkRateLimit(ip, 'auth/forgot-password', 3, 15 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: { 'Retry-After': Math.ceil((rateLimit.resetAt.getTime() - Date.now()) / 1000).toString() },
        }
      );
    }

    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Always return success to prevent email enumeration
    const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (user && user.status === 'ACTIVE') {
      // Invalidate any existing unused tokens for this user
      await prisma.passwordResetToken.updateMany({
        where: { userId: user.id, usedAt: null },
        data: { usedAt: new Date() },
      });

      // Generate a secure random token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: { token, userId: user.id, expiresAt },
      });

      await emailService.sendPasswordResetEmail(normalizedEmail, token);
    }

    // Same response whether email exists or not
    return NextResponse.json({
      success: true,
      message: 'If that email is registered, a reset link has been sent.',
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
