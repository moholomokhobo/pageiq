import { inferCategoryFromPageName } from "@/lib/discover-live";
import type { FacebookPageStats } from "@/lib/facebook-scraper-core";
import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import { parseCountValue } from "@/lib/metrics";
import { parseMultiplier } from "@/lib/traffic-light";

export type PageDatabaseRow = {
  id: string;
  page_url: string;
  page_name: string;
  category: string;
  country: string | null;
  followers: number;
  avg_views_reel: number;
  avg_views_image: number;
  avg_views_text: number;
  outlier_score: number;
  monetization_score: number;
  days_since_start: number;
  total_posts: number;
  last_scraped_at: string;
  is_rising_star: boolean;
  is_outlier: boolean;
};

export type PageDatabaseInsert = Omit<
  PageDatabaseRow,
  "id" | "last_scraped_at"
> & {
  last_scraped_at?: string;
};

export const SEED_PAGES_CONFIG = [
  { url: "https://www.facebook.com/Netflix", category: "Entertainment" },
  { url: "https://www.facebook.com/disney", category: "Entertainment" },
  { url: "https://www.facebook.com/ESPN", category: "Sports" },
  { url: "https://www.facebook.com/nba", category: "Sports" },
  { url: "https://www.facebook.com/nike", category: "Sports" },
  { url: "https://www.facebook.com/buzzfeedtasty", category: "Food" },
  { url: "https://www.facebook.com/foodnetwork", category: "Food" },
  { url: "https://www.facebook.com/Forbes", category: "Business" },
  { url: "https://www.facebook.com/entrepreneur", category: "Business" },
  { url: "https://www.facebook.com/Apple", category: "Technology" },
  { url: "https://www.facebook.com/Google", category: "Technology" },
  { url: "https://www.facebook.com/Microsoft", category: "Technology" },
  { url: "https://www.facebook.com/Vogue", category: "Fashion" },
  { url: "https://www.facebook.com/zara", category: "Fashion" },
  { url: "https://www.facebook.com/cnn", category: "News" },
  { url: "https://www.facebook.com/bbcnews", category: "News" },
  { url: "https://www.facebook.com/joelosteen", category: "Religion" },
  { url: "https://www.facebook.com/BishopTDJakes", category: "Religion" },
  { url: "https://www.facebook.com/natgeo", category: "Entertainment" },
  { url: "https://www.facebook.com/9gag", category: "Entertainment" },
] as const;

function estimateDaysSinceStart(stats: FacebookPageStats): number {
  const activity = stats.postsLast30Days + stats.postsThisMonth;
  return Math.max(120, Math.min(4_500, Math.round(activity * 14 + 90)));
}

function deriveAvgViews(
  stats: FacebookPageStats,
  kind: "reel" | "image" | "text"
): number {
  const fromScraper =
    kind === "reel"
      ? stats.estimatedAvgViewsPerReel
      : kind === "image"
        ? stats.estimatedAvgViewsPerImage
        : stats.estimatedAvgViewsPerText;

  if (fromScraper != null && fromScraper > 0) return fromScraper;

  const followers = parseCountValue(stats.followerCount);
  const base = Math.max(5_000, Math.round(followers * 0.02));
  if (kind === "reel") return base;
  if (kind === "image") return Math.round(base * 0.65);
  return Math.round(base * 0.4);
}

export function engagementMultiplierFromStats(
  stats: FacebookPageStats
): number {
  const fromPosts = stats.outlierPosts
    .map((post) => parseMultiplier(post.multiplier))
    .filter((value) => Number.isFinite(value) && value > 0);
  if (fromPosts.length > 0) {
    return Math.max(...fromPosts);
  }
  return Number((3.5 + (stats.outlierScore / 100) * 4.5).toFixed(2));
}

export function mapScrapeToPageInsert(
  searchQuery: string,
  stats: FacebookPageStats,
  category?: string
): PageDatabaseInsert {
  const { urls } = resolveFacebookPageUrls(searchQuery);
  const pageUrl = urls[0] ?? searchQuery.trim();
  const followers = parseCountValue(stats.followerCount);
  const outlierScore = Math.round(stats.outlierScore);
  const monetizationScore = Math.round(stats.monetization.monetizationScore);
  const multiplier = engagementMultiplierFromStats(stats);
  const isOutlier = multiplier > 3;
  const isRisingStar = followers < 100_000 && multiplier > 5;
  const resolvedCategory =
    category ?? inferCategoryFromPageName(stats.pageName);

  return {
    page_url: pageUrl,
    page_name: stats.pageName,
    category: resolvedCategory,
    country: stats.homeCountry ?? "Not listed",
    followers,
    avg_views_reel: deriveAvgViews(stats, "reel"),
    avg_views_image: deriveAvgViews(stats, "image"),
    avg_views_text: deriveAvgViews(stats, "text"),
    outlier_score: outlierScore,
    monetization_score: monetizationScore,
    days_since_start: estimateDaysSinceStart(stats),
    total_posts: Math.max(
      stats.postsLast30Days,
      stats.postsThisMonth,
      stats.outlierPosts.length
    ),
    is_rising_star: isRisingStar,
    is_outlier: isOutlier,
  };
}

export const MIN_PAGES_FOR_DB_OVERVIEW_SECTIONS = 4;

export function periodToSinceDate(period: string): Date | null {
  const now = Date.now();
  switch (period) {
    case "Last 7 Days":
      return new Date(now - 7 * 24 * 60 * 60 * 1000);
    case "Last 14 Days":
      return new Date(now - 14 * 24 * 60 * 60 * 1000);
    case "Last 30 Days":
      return new Date(now - 30 * 24 * 60 * 60 * 1000);
    case "Last 6 Months":
      return new Date(now - 183 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}
