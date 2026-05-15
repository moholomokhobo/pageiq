import { parseCountValue, parseEngagementRate } from "@/lib/metrics";

export const HIGH_CPM_COUNTRIES = ["USA", "UK", "Australia", "Canada"] as const;

export type CpmTier = "high" | "mixed" | "low";

export type AudienceCountrySlice = {
  country: string;
  percent: number;
  isHighCpm: boolean;
};

export type MonetizationIntel = {
  audienceBreakdown: AudienceCountrySlice[];
  highCpmPercent: number;
  estimatedMonthlyViews: number;
  monthlyEarningsLow: number;
  monthlyEarningsHigh: number;
  monthlyEarningsRange: string;
  cpmTier: CpmTier;
  cpmLabel: string;
  monetizationScore: number;
};

export type MonetizationInput = {
  pageName: string;
  followerCount: number | string;
  engagementRate: number | string;
  contentType: string;
  homeCountry?: string;
  postsLast30Days?: number;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function createSeededRandom(seed: string) {
  let state = hashString(seed) % 2147483646 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function normalizeContentType(raw: string): "video" | "image" | "text" {
  const value = raw.toLowerCase();
  if (value.includes("reel") || value.includes("video")) return "video";
  if (value.includes("image") || value.includes("photo")) return "image";
  return "text";
}

function contentTypeMultiplier(type: "video" | "image" | "text"): number {
  if (type === "video") return 1.35;
  if (type === "image") return 1.05;
  return 0.82;
}

function homeCountryHighCpmBias(homeCountry?: string): number {
  const map: Record<string, number> = {
    USA: 0.82,
    UK: 0.76,
    Australia: 0.74,
    Canada: 0.7,
    "South Africa": 0.34,
    Nigeria: 0.16,
    Kenya: 0.2,
    Global: 0.48,
  };
  if (!homeCountry) return 0.42;
  return map[homeCountry] ?? 0.38;
}

function buildAudienceBreakdown(
  pageName: string,
  homeCountry?: string
): AudienceCountrySlice[] {
  const rand = createSeededRandom(`${pageName}:audience`);
  const bias = homeCountryHighCpmBias(homeCountry);

  let usa = 18 + bias * 42 + rand() * 12;
  let uk = 8 + bias * 22 + rand() * 8;
  let australia = 4 + bias * 12 + rand() * 6;
  let canada = 4 + bias * 10 + rand() * 5;

  const home =
    homeCountry && homeCountry !== "Global" && !HIGH_CPM_COUNTRIES.includes(homeCountry as (typeof HIGH_CPM_COUNTRIES)[number])
      ? 12 + rand() * 28
      : 0;

  let other = Math.max(8, 100 - usa - uk - australia - canada - home);

  const total = usa + uk + australia + canada + home + other;
  usa = (usa / total) * 100;
  uk = (uk / total) * 100;
  australia = (australia / total) * 100;
  canada = (canada / total) * 100;
  const homePct = (home / total) * 100;
  other = (other / total) * 100;

  const slices: AudienceCountrySlice[] = [
    { country: "USA", percent: Math.round(usa), isHighCpm: true },
    { country: "UK", percent: Math.round(uk), isHighCpm: true },
    { country: "Australia", percent: Math.round(australia), isHighCpm: true },
    { country: "Canada", percent: Math.round(canada), isHighCpm: true },
  ];

  if (home > 0 && homeCountry) {
    slices.push({
      country: homeCountry,
      percent: Math.round(homePct),
      isHighCpm: false,
    });
  }

  slices.push({
    country: "Other markets",
    percent: Math.round(other),
    isHighCpm: false,
  });

  const sum = slices.reduce((s, x) => s + x.percent, 0);
  if (sum !== 100) {
    slices[0].percent += 100 - sum;
  }

  return slices;
}

function resolveFollowers(value: number | string): number {
  if (typeof value === "number") return Math.max(0, value);
  return parseCountValue(value);
}

function resolveEngagement(value: number | string): number {
  if (typeof value === "number") return Math.max(0.1, value);
  return Math.max(0.1, parseEngagementRate(value));
}

export function getCpmTier(highCpmPercent: number): CpmTier {
  if (highCpmPercent >= 55) return "high";
  if (highCpmPercent >= 28) return "mixed";
  return "low";
}

export function cpmTierLabel(tier: CpmTier): string {
  if (tier === "high") return "High-paying advertisers";
  if (tier === "mixed") return "Mixed CPM markets";
  return "Lower CPM markets";
}

function formatMoney(value: number): string {
  return value.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

export function formatEarningsRange(low: number, high: number): string {
  return `${formatMoney(low)} - ${formatMoney(high)}/month`;
}

function estimateMonthlyViews(
  followers: number,
  engagementPercent: number,
  postsLast30Days: number
): number {
  const posts = Math.max(postsLast30Days, 8);
  const reachRate = Math.min(0.35, 0.08 + engagementPercent / 100);
  const viewsPerPost = followers * reachRate * (1 + engagementPercent / 50);
  return Math.round(viewsPerPost * posts);
}

function effectiveCpm(highCpmPercent: number, content: "video" | "image" | "text"): number {
  const baseCpm = 2.2 + (highCpmPercent / 100) * 11.5;
  return baseCpm * contentTypeMultiplier(content);
}

function scorePageSize(followers: number): number {
  if (followers <= 0) return 5;
  const log = Math.log10(Math.max(followers, 100));
  return Math.min(25, Math.max(5, (log - 2) * 9));
}

function scoreEngagement(rate: number): number {
  return Math.min(25, Math.max(3, rate * 4.2));
}

function scoreContentType(content: "video" | "image" | "text"): number {
  if (content === "video") return 25;
  if (content === "image") return 16;
  return 10;
}

function scoreAudience(highCpmPercent: number): number {
  return Math.min(25, Math.max(4, (highCpmPercent / 100) * 25));
}

export function calculateMonetizationIntel(
  input: MonetizationInput
): MonetizationIntel {
  const followers = resolveFollowers(input.followerCount);
  const engagementPercent = resolveEngagement(input.engagementRate);
  const content = normalizeContentType(input.contentType);
  const postsLast30Days = input.postsLast30Days ?? 12;

  const audienceBreakdown = buildAudienceBreakdown(
    input.pageName,
    input.homeCountry
  );
  const highCpmPercent = audienceBreakdown
    .filter((s) => s.isHighCpm)
    .reduce((sum, s) => sum + s.percent, 0);

  const monthlyViews = estimateMonthlyViews(
    followers,
    engagementPercent,
    postsLast30Days
  );
  const cpm = effectiveCpm(highCpmPercent, content);
  const baseRevenue = (monthlyViews / 1000) * cpm;
  const monthlyEarningsLow = Math.round(baseRevenue * 0.72);
  const monthlyEarningsHigh = Math.round(baseRevenue * 1.38);

  const cpmTier = getCpmTier(highCpmPercent);
  const monetizationScore = Math.round(
    Math.min(
      100,
      scorePageSize(followers) +
        scoreEngagement(engagementPercent) +
        scoreContentType(content) +
        scoreAudience(highCpmPercent)
    )
  );

  return {
    audienceBreakdown,
    highCpmPercent: Math.round(highCpmPercent),
    estimatedMonthlyViews: monthlyViews,
    monthlyEarningsLow,
    monthlyEarningsHigh,
    monthlyEarningsRange: formatEarningsRange(
      monthlyEarningsLow,
      monthlyEarningsHigh
    ),
    cpmTier,
    cpmLabel: cpmTierLabel(cpmTier),
    monetizationScore,
  };
}

export function inferContentTypeFromPostTypes(
  types: string[]
): "video" | "image" | "text" {
  if (types.length === 0) return "video";
  const counts = { video: 0, image: 0, text: 0 };
  for (const raw of types) {
    const t = normalizeContentType(raw);
    counts[t] += 1;
  }
  if (counts.video >= counts.image && counts.video >= counts.text) return "video";
  if (counts.image >= counts.text) return "image";
  return "text";
}
