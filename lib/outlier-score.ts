import { parseCountValue, parseEngagementRate } from "@/lib/metrics";
import { parseMultiplier } from "@/lib/traffic-light";

export const OUTLIER_SCORE_TOOLTIP =
  "Pages with small audiences but outsized engagement and earnings score highest";

/** Rewards low followers, high engagement, and strong monetization. */
export function calculateOutlierScore(
  followers: number,
  engagementRatePercent: number,
  monetizationScore: number,
  postsLast30Days = 12
): number {
  const engagementScore = Math.min(45, engagementRatePercent * 3);
  const sizeBonus = Math.max(
    0,
    35 - Math.log10(Math.max(followers, 100)) * 5
  );
  const monetizationComponent = Math.min(25, monetizationScore * 0.25);
  const activityScore = Math.min(10, postsLast30Days * 0.5);

  return Math.round(
    Math.min(
      100,
      Math.max(
        0,
        engagementScore + sizeBonus + monetizationComponent + activityScore
      )
    )
  );
}

export function calculateOutlierScoreFromStrings(
  followerCount: string,
  engagementRate: string,
  monetizationScore: number,
  postsLast30Days = 12
): number {
  return calculateOutlierScore(
    parseCountValue(followerCount),
    parseEngagementRate(engagementRate),
    monetizationScore,
    postsLast30Days
  );
}

export function isHiddenGem(
  followers: number,
  engagementRatePercent: number,
  monetizationScore: number
): boolean {
  return (
    followers < 500_000 &&
    engagementRatePercent > 5 &&
    monetizationScore > 70
  );
}

export function isHiddenGemFromStrings(
  followerCount: string,
  engagementRate: string,
  monetizationScore: number
): boolean {
  return isHiddenGem(
    parseCountValue(followerCount),
    parseEngagementRate(engagementRate),
    monetizationScore
  );
}

export function isPostOutlier(multiplier: string): boolean {
  return parseMultiplier(multiplier) >= 3;
}
