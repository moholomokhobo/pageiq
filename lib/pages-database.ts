import type { MonetizationIntel } from "@/lib/cpm-intelligence";
import { inferCategoryFromPageName } from "@/lib/discover-live";
import type {
  FacebookPageStats,
  OutlierPostResult,
} from "@/lib/facebook-scraper-core";
import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import type { PopularPost } from "@/lib/pages-list-data";
import {
  normalizeMonetization,
  normalizeOutlierPosts,
  normalizePopularPosts,
} from "@/lib/search-api-response";
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
  profile_picture_url?: string | null;
  description?: string | null;
  popular_posts?: PopularPost[] | null;
  outlier_posts?: OutlierPostResult[] | null;
  engagement_rate?: number | null;
  posts_last_30_days?: number;
  posts_this_month?: number;
  posts_today?: number;
  sample_posts_analysis?: boolean;
  monetization?: MonetizationIntel | null;
};

function isUsableProfilePictureUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes("facebook.com") &&
      parsed.pathname.includes("/photo")
    ) {
      return false;
    }
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/** Cached row is complete enough to serve (requires a direct profile image URL). */
export function cachedRowHasProfilePicture(
  row: PageDatabaseRow | Record<string, unknown>
): boolean {
  const normalized = normalizePageDatabaseRow(row);
  const url = normalized.profile_picture_url?.trim();
  return Boolean(url && isUsableProfilePictureUrl(url));
}

/** Parse "15%" or 15 from DB into a numeric rate for storage. */
export function parseEngagementRateForDatabase(
  engagementRate: string | number | null | undefined
): number | null {
  if (engagementRate == null) return null;
  if (typeof engagementRate === "number") {
    return Number.isFinite(engagementRate) ? engagementRate : null;
  }
  const parsed = parseFloat(String(engagementRate).replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

/** Format numeric DB rate as "15%" for API responses. */
export function formatEngagementRateFromDatabase(
  engagementRate: number | string | null | undefined
): string {
  const value = parseEngagementRateForDatabase(engagementRate);
  if (value == null) return "0%";
  return `${value}%`;
}

/** True when row has a full scrape snapshot (post-migration or fresh upsert). */
export function pageDatabaseRowHasFullScrape(row: PageDatabaseRow): boolean {
  return Boolean(
    parseEngagementRateForDatabase(row.engagement_rate) != null &&
      row.monetization &&
      typeof row.monetization === "object" &&
      row.description != null
  );
}

/** Normalize raw Supabase row (parse jsonb strings, coerce numeric fields). */
export function normalizePageDatabaseRow(
  raw: PageDatabaseRow | Record<string, unknown>
): PageDatabaseRow {
  const row = raw as Record<string, unknown>;

  return {
    id: String(row.id ?? ""),
    page_url: String(row.page_url ?? ""),
    page_name: String(row.page_name ?? ""),
    category: String(row.category ?? ""),
    country: row.country != null ? String(row.country) : null,
    followers: Number(row.followers) || 0,
    avg_views_reel: Number(row.avg_views_reel) || 0,
    avg_views_image: Number(row.avg_views_image) || 0,
    avg_views_text: Number(row.avg_views_text) || 0,
    outlier_score: Number(row.outlier_score) || 0,
    monetization_score: Number(row.monetization_score) || 0,
    days_since_start: Number(row.days_since_start) || 0,
    total_posts: Number(row.total_posts) || 0,
    last_scraped_at: String(row.last_scraped_at ?? ""),
    is_rising_star: Boolean(row.is_rising_star),
    is_outlier: Boolean(row.is_outlier),
    profile_picture_url:
      typeof row.profile_picture_url === "string"
        ? row.profile_picture_url.trim() || null
        : null,
    description:
      row.description != null ? String(row.description) : null,
    popular_posts: normalizePopularPosts(row.popular_posts),
    outlier_posts: normalizeOutlierPosts(row.outlier_posts),
    engagement_rate: parseEngagementRateForDatabase(
      row.engagement_rate as string | number | null | undefined
    ),
    posts_last_30_days: Number(row.posts_last_30_days) || 0,
    posts_this_month: Number(row.posts_this_month) || 0,
    posts_today: Number(row.posts_today) || 0,
    sample_posts_analysis: Boolean(row.sample_posts_analysis),
    monetization: normalizeMonetization(row.monetization),
  };
}

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
    profile_picture_url: stats.profilePictureUrl ?? null,
    description: stats.about,
    popular_posts: stats.popularPosts ?? [],
    outlier_posts: stats.outlierPosts,
    engagement_rate:
      parseEngagementRateForDatabase(stats.engagementRate) ?? null,
    posts_last_30_days: stats.postsLast30Days,
    posts_this_month: stats.postsThisMonth,
    posts_today: stats.postsToday,
    sample_posts_analysis: stats.samplePostsAnalysis,
    monetization: stats.monetization,
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
