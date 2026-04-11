import { prisma } from '@/lib/prisma';

/**
 * Checks an affiliate's active merchant count and promotes them to the
 * highest eligible PartnerGroup tier. Safe to call on every conversion.
 *
 * Tier thresholds (stored on PartnerGroup.tierThreshold):
 *   Bronze = 0  (default entry)
 *   Silver = 10 active merchants
 *   Gold   = 25 active merchants
 */
export async function checkAndEscalateTier(affiliateId: string): Promise<{
  promoted: boolean;
  previousTier: string | null;
  newTier: string | null;
}> {
  // Count unique active merchants referred by this affiliate
  // A "merchant" = a unique conversion with status APPROVED or PAID
  const activeMerchantCount = await prisma.conversion.count({
    where: {
      affiliateId,
      status: { in: ['APPROVED', 'PAID'] },
    },
  });

  // Load all tiers ordered by threshold descending — highest wins
  const tiers = await prisma.partnerGroup.findMany({
    where: { tierThreshold: { not: null } },
    orderBy: { tierThreshold: 'desc' },
  });

  if (tiers.length === 0) {
    return { promoted: false, previousTier: null, newTier: null };
  }

  // Find the highest tier the affiliate qualifies for
  const eligibleTier = tiers.find(
    (t) => activeMerchantCount >= (t.tierThreshold ?? 0)
  );

  if (!eligibleTier) {
    return { promoted: false, previousTier: null, newTier: null };
  }

  // Get current affiliate tier
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: { partnerGroup: true },
  });

  if (!affiliate) {
    return { promoted: false, previousTier: null, newTier: null };
  }

  const currentGroupId = affiliate.partnerGroupId;

  // Already in the correct or higher tier — no change needed
  if (currentGroupId === eligibleTier.id) {
    return { promoted: false, previousTier: eligibleTier.name, newTier: eligibleTier.name };
  }

  const currentTierThreshold = affiliate.partnerGroup?.tierThreshold ?? -1;
  // Only promote upward, never demote
  if (currentTierThreshold >= (eligibleTier.tierThreshold ?? 0)) {
    return {
      promoted: false,
      previousTier: affiliate.partnerGroup?.name ?? null,
      newTier: affiliate.partnerGroup?.name ?? null,
    };
  }

  // Promote the affiliate
  await prisma.affiliate.update({
    where: { id: affiliateId },
    data: { partnerGroupId: eligibleTier.id },
  });

  return {
    promoted: true,
    previousTier: affiliate.partnerGroup?.name ?? null,
    newTier: eligibleTier.name,
  };
}
