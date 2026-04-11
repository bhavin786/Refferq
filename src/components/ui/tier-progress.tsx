'use client';

import React from 'react';
import { Award } from 'lucide-react';

interface TierProgressProps {
  currentTier: string | null;
  activeMerchants: number;
}

const TIERS = [
  { name: 'Bronze', rate: 15, threshold: 0, color: 'text-amber-500', bg: 'bg-amber-500', track: 'bg-amber-900/30' },
  { name: 'Silver', rate: 20, threshold: 10, color: 'text-slate-300', bg: 'bg-slate-400', track: 'bg-slate-700/40' },
  { name: 'Gold',   rate: 25, threshold: 25, color: 'text-yellow-400', bg: 'bg-yellow-400', track: 'bg-yellow-900/30' },
];

export function TierProgress({ currentTier, activeMerchants }: TierProgressProps) {
  const tierIndex = TIERS.findIndex((t) => t.name === currentTier) ?? 0;
  const safeIndex = Math.max(0, tierIndex);
  const current = TIERS[safeIndex];
  const next = TIERS[safeIndex + 1] ?? null;

  const progressToNext = next
    ? Math.min(100, Math.round(((activeMerchants - current.threshold) / (next.threshold - current.threshold)) * 100))
    : 100;

  const merchantsToNext = next ? Math.max(0, next.threshold - activeMerchants) : 0;

  return (
    <div className="rounded-xl border border-white/10 bg-white/3 p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className={`w-5 h-5 ${current.color}`} />
          <span className="font-semibold text-sm">Partner Tier</span>
        </div>
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${current.track} ${current.color}`}>
          {current.name}
        </span>
      </div>

      {/* Current rate */}
      <div>
        <span className={`text-3xl font-black ${current.color}`}>{current.rate}%</span>
        <span className="text-gray-500 text-sm ml-2">recurring commission</span>
      </div>

      {/* Progress to next tier */}
      {next ? (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-500">
            <span>{activeMerchants} active merchants</span>
            <span>{next.threshold} → {next.name} ({next.rate}%)</span>
          </div>
          <div className={`h-2 rounded-full ${current.track} overflow-hidden`}>
            <div
              className={`h-full rounded-full ${current.bg} transition-all duration-700`}
              style={{ width: `${progressToNext}%` }}
            />
          </div>
          <p className="text-xs text-gray-500">
            {merchantsToNext === 0
              ? `Eligible for ${next.name} upgrade!`
              : `${merchantsToNext} more merchant${merchantsToNext === 1 ? '' : 's'} to unlock ${next.name} (${next.rate}%)`}
          </p>
        </div>
      ) : (
        <p className="text-xs text-yellow-400/80">
          🏆 Maximum tier reached — you're earning the highest commission rate.
        </p>
      )}

      {/* Tier ladder */}
      <div className="flex items-center gap-1 pt-1">
        {TIERS.map((t, i) => (
          <React.Fragment key={t.name}>
            <div className={`flex items-center gap-1 text-xs ${i <= safeIndex ? t.color : 'text-gray-600'}`}>
              <span className={`w-2 h-2 rounded-full ${i <= safeIndex ? t.bg : 'bg-gray-700'}`} />
              {t.name}
            </div>
            {i < TIERS.length - 1 && (
              <div className={`flex-1 h-px ${i < safeIndex ? 'bg-gray-500' : 'bg-gray-700'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/** Inline tier badge — drop into any table row or header */
export function TierBadge({ tier }: { tier: string | null }) {
  const t = TIERS.find((t) => t.name === tier) ?? TIERS[0];
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${t.track} ${t.color}`}>
      <Award className="w-3 h-3" />
      {t.name}
    </span>
  );
}
