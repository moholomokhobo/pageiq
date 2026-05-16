import type { MonetizationIntel } from "@/lib/cpm-intelligence";
import type {
  FacebookPageStats,
  OutlierPostResult,
} from "@/lib/facebook-scraper-core";
import type { PopularPost } from "@/lib/pages-list-data";

export type SearchApiResponse = FacebookPageStats & { fromCache: boolean };

/** Parse jsonb columns that may arrive as JSON strings from Supabase/PostgREST. */
export function parseDatabaseJsonField<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return fallback;
    try {
      return JSON.parse(trimmed) as T;
    } catch {
      console.warn("[parseDatabaseJsonField] JSON.parse failed for value:", trimmed.slice(0, 120));
      return fallback;
    }
  }
  return value as T;
}

function isMonetizationIntel(value: unknown): value is MonetizationIntel {
  return (
    value != null &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    "monetizationScore" in value &&
    "monthlyEarningsRange" in value
  );
}

function normalizeOutlierPost(raw: unknown): OutlierPostResult | null {
  if (!raw || typeof raw !== "object") return null;
  const post = raw as Record<string, unknown>;
  if (typeof post.preview !== "string") return null;

  return {
    preview: post.preview,
    likes: String(post.likes ?? ""),
    comments: String(post.comments ?? ""),
    shares: String(post.shares ?? ""),
    type: (post.type as OutlierPostResult["type"]) ?? "text",
    multiplier: String(post.multiplier ?? ""),
    totalEngagement: String(post.totalEngagement ?? ""),
    postedAt: String(post.postedAt ?? ""),
  };
}

function normalizePopularPost(raw: unknown): PopularPost | null {
  if (!raw || typeof raw !== "object") return null;
  const post = raw as Record<string, unknown>;
  if (typeof post.title !== "string") return null;

  const likes = Number(post.likes) || 0;
  const comments = Number(post.comments) || 0;
  const shares = Number(post.shares) || 0;

  return {
    id: String(post.id ?? ""),
    title: post.title,
    views: String(post.views ?? ""),
    viewsRaw: Number(post.viewsRaw) || 0,
    timeAgo: String(post.timeAgo ?? ""),
    thumbnailHue: Number(post.thumbnailHue) || 0,
    overlayLabel: String(post.overlayLabel ?? ""),
    thumbnailUrl:
      post.thumbnailUrl != null && post.thumbnailUrl !== ""
        ? String(post.thumbnailUrl)
        : null,
    likes,
    comments,
    shares,
    engagementScore: Number(post.engagementScore) || shares * 3 + likes + comments * 2,
    postUrl: post.postUrl != null ? String(post.postUrl) : undefined,
    isOutlier: post.isOutlier === true,
    engagementRatePercent:
      post.engagementRatePercent != null
        ? Number(post.engagementRatePercent)
        : undefined,
  };
}

function normalizeOutlierPosts(value: unknown): OutlierPostResult[] {
  const parsed = parseDatabaseJsonField<unknown[]>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => normalizeOutlierPost(item))
    .filter((item): item is OutlierPostResult => item != null);
}

function normalizePopularPosts(value: unknown): PopularPost[] {
  const parsed = parseDatabaseJsonField<unknown[]>(value, []);
  if (!Array.isArray(parsed)) return [];
  return parsed
    .map((item) => normalizePopularPost(item))
    .filter((item): item is PopularPost => item != null);
}

function normalizeMonetization(value: unknown): MonetizationIntel | null {
  const parsed = parseDatabaseJsonField<unknown>(value, null);
  return isMonetizationIntel(parsed) ? parsed : null;
}

/**
 * Build the exact JSON body returned by GET /api/search (live or cached).
 * Uses camelCase keys matching FacebookPageStats — never snake_case DB columns.
 */
export function facebookPageStatsToSearchResponse(
  stats: FacebookPageStats,
  fromCache: boolean
): SearchApiResponse {
  const response: SearchApiResponse = {
    pageName: stats.pageName,
    about: stats.about,
    followerCount: stats.followerCount,
    engagementRate: stats.engagementRate,
    postsLast30Days: Number(stats.postsLast30Days) || 0,
    postsThisMonth: Number(stats.postsThisMonth) || 0,
    postsToday: Number(stats.postsToday) || 0,
    outlierScore: Number(stats.outlierScore) || 0,
    samplePostsAnalysis: Boolean(stats.samplePostsAnalysis),
    homeCountry: stats.homeCountry ?? null,
    monetization: stats.monetization,
    outlierPosts: Array.isArray(stats.outlierPosts) ? stats.outlierPosts : [],
    fromCache,
  };

  const profileUrl = stats.profilePictureUrl?.trim();
  if (profileUrl) {
    response.profilePictureUrl = profileUrl;
  }

  if (stats.popularPosts?.length) {
    response.popularPosts = stats.popularPosts;
  }

  if (stats.estimatedAvgViewsPerReel != null && stats.estimatedAvgViewsPerReel > 0) {
    response.estimatedAvgViewsPerReel = Number(stats.estimatedAvgViewsPerReel);
  }
  if (stats.estimatedAvgViewsPerImage != null && stats.estimatedAvgViewsPerImage > 0) {
    response.estimatedAvgViewsPerImage = Number(stats.estimatedAvgViewsPerImage);
  }
  if (stats.estimatedAvgViewsPerText != null && stats.estimatedAvgViewsPerText > 0) {
    response.estimatedAvgViewsPerText = Number(stats.estimatedAvgViewsPerText);
  }

  if (stats.usesRealReelViews) {
    response.usesRealReelViews = true;
  }
  if (stats.usesRealImageViews) {
    response.usesRealImageViews = true;
  }
  if (stats.usesRealTextEngagement) {
    response.usesRealTextEngagement = true;
  }

  if (stats.reelAvgPeriod) {
    response.reelAvgPeriod = stats.reelAvgPeriod;
  }
  if (stats.imageAvgPeriod) {
    response.imageAvgPeriod = stats.imageAvgPeriod;
  }
  if (stats.textAvgPeriod) {
    response.textAvgPeriod = stats.textAvgPeriod;
  }

  return response;
}

export {
  normalizeMonetization,
  normalizeOutlierPosts,
  normalizePopularPosts,
};
