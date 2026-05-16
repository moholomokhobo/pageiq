import type { PageListItem } from "@/lib/pages-list-data";
import { parseMultiplier } from "@/lib/traffic-light";

export type EarningPotentialTier = "high" | "growing" | "early";

export type EarningPotentialFilter = "all" | EarningPotentialTier;

export const EARNING_POTENTIAL_TOOLTIP =
  "Based on Facebook Content Monetization eligibility signals — 10K+ followers, high views and consistent posting are key requirements";

export function calculateEarningPotentialScore(page: PageListItem): number {
  let score = 0;
  if (page.followersRaw > 10_000) score += 30;
  if (page.avgViewsPerReelRaw > 50_000) score += 25;
  if (parseMultiplier(page.outlierMultiplier) > 3) score += 20;
  if (page.daysSinceStart > 90) score += 15;
  if (page.numberOfPosts > 50) score += 10;
  return score;
}

export function getEarningPotentialTier(score: number): EarningPotentialTier {
  if (score > 75) return "high";
  if (score >= 45) return "growing";
  return "early";
}

export function getEarningPotentialFromPage(page: PageListItem) {
  const score = calculateEarningPotentialScore(page);
  return { score, tier: getEarningPotentialTier(score) };
}

export const EARNING_POTENTIAL_BADGE: Record<
  EarningPotentialTier,
  { label: string; className: string }
> = {
  high: {
    label: "High Earning Potential",
    className:
      "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/60 dark:bg-emerald-950/50 dark:text-emerald-300",
  },
  growing: {
    label: "Growing",
    className:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/50 dark:text-amber-300",
  },
  early: {
    label: "Early Stage",
    className:
      "border-slate-200 bg-slate-100 text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400",
  },
};
