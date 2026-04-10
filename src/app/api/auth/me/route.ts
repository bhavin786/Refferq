import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(request: NextRequest) {
  try {
    // Prefer middleware-injected header; fall back to decoding the cookie directly
    let userId = request.headers.get('x-user-id');

    if (!userId) {
      const token = request.cookies.get('auth-token')?.value;
      if (!token) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      const { payload } = await jwtVerify(token, JWT_SECRET);
      userId = payload.userId as string;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { affiliate: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        hasAffiliate: !!user.affiliate,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }
}
