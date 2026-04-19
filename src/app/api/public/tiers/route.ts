import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/public/tiers
 *
 * Returns partner tier groups ordered by commission rate ascending.
 * Public endpoint — no auth required.
 */
export async function GET() {
  try {
    const tiers = await prisma.partnerGroup.findMany({
      orderBy: { commissionRate: 'asc' },
      select: {
        id: true,
        name: true,
        commissionRate: true,
        tierThreshold: true,
      },
    });
    return NextResponse.json(tiers);
  } catch (error) {
    console.error('Failed to fetch tiers:', error);
    return NextResponse.json([], { status: 200 });
  }
}
