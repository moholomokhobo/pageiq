import {
  formatCount,
  type FacebookPageStats,
  type OutlierPostResult,
  type PostType,
} from "@/lib/facebook-scraper-core";
import { calculateMonetizationIntel } from "@/lib/cpm-intelligence";
import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import {
  formatEngagementRateFromDatabase,
  normalizePageDatabaseRow,
  pageDatabaseRowHasFullScrape,
  type PageDatabaseRow,
} from "@/lib/pages-database";
import type { PopularPost } from "@/lib/pages-list-data";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, pagesDatabaseTable } from "@/lib/supabase/tables";

export const PAGE_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

async function getReadClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createAdminClient();
  }
  return createClient();
}

function engagementRateFromRow(row: PageDatabaseRow): string {
  const rate = Math.min(
    12,
    Math.max(0.5, 1 + (row.outlier_score / 100) * 6)
  );
  return `${Number(rate.toFixed(1))}%`;
}

function buildLegacyOutlierPosts(row: PageDatabaseRow): OutlierPostResult[] {
  const multiplier = Number(
    (3.5 + (row.outlier_score / 100) * 4.5).toFixed(2)
  );
  const previews = [
    "Top-performing post from recent activity",
    "Strong engagement vs page average",
    "Consistent outlier-style performance",
  ];
  const types: PostType[] = ["reel", "video", "image"];
  const baseEngagement = Math.max(
    500,
    Math.round(row.followers * 0.002 * multiplier)
  );

  return previews.map((preview, index) => {
    const m = Math.max(3, Number((multiplier - index * 0.35).toFixed(1)));
    const eng = Math.round(baseEngagement / (1 + index * 0.25));
    return {
      preview,
      likes: formatCount(Math.round(eng * 0.72)),
      comments: formatCount(Math.round(eng * 0.18)),
      shares: formatCount(Math.round(eng * 0.1)),
      type: types[index] ?? "video",
      multiplier: `${m}x`,
      totalEngagement: formatCount(eng),
      postedAt: `${1 + index}d ago`,
    };
  });
}

function buildLegacyPopularPosts(
  row: PageDatabaseRow,
  pageId: string
): PopularPost[] {
  const views = [
    { label: "Reel", raw: row.avg_views_reel },
    { label: "Image", raw: row.avg_views_image },
    { label: "Text", raw: row.avg_views_text },
  ].filter((entry) => entry.raw > 0);

  return views.slice(0, 3).map((entry, index) => {
    const likes = Math.round(entry.raw * 0.04);
    const comments = Math.round(entry.raw * 0.01);
    const shares = Math.round(entry.raw * 0.005);
    return {
      id: `${pageId}-cached-${index}`,
      title: `Recent ${entry.label.toLowerCase()} post`,
      views:
        entry.raw >= 1_000_000
          ? `${(entry.raw / 1_000_000).toFixed(1)}M`
          : entry.raw >= 1_000
            ? `${Math.round(entry.raw / 1_000)}K`
            : String(entry.raw),
      viewsRaw: entry.raw,
      timeAgo: `${index + 1}d ago`,
      thumbnailHue: (index * 47 + row.page_name.length * 11) % 360,
      overlayLabel: entry.label,
      likes,
      comments,
      shares,
      engagementScore: shares * 3 + likes + comments * 2,
    };
  });
}

function pageDatabaseRowToLegacyFacebookPageStats(
  row: PageDatabaseRow
): FacebookPageStats {
  const engagementRate = engagementRateFromRow(row);
  const homeCountry =
    row.country && row.country !== "Not listed" ? row.country : null;
  const postsLast30Days = Math.min(30, row.total_posts);
  const monetizationBase = calculateMonetizationIntel({
    pageName: row.page_name,
    followerCount: row.followers,
    engagementRate,
    contentType: "Reels",
    homeCountry: homeCountry ?? undefined,
    postsLast30Days,
  });
  const monetization = {
    ...monetizationBase,
    monetizationScore: row.monetization_score,
  };
  const pageId = `cached-${row.id}`;
  const storedPopular = row.popular_posts ?? [];
  const storedOutlier = row.outlier_posts ?? [];
  const profileUrl = row.profile_picture_url?.trim();

  return {
    pageName: row.page_name,
    about: row.description ?? `Facebook page · ${row.category}`,
    followerCount: formatCount(row.followers),
    engagementRate,
    postsLast30Days,
    postsThisMonth: row.total_posts,
    postsToday: Math.max(0, Math.round(row.total_posts / 30)),
    outlierScore: row.outlier_score,
    samplePostsAnalysis: true,
    profilePictureUrl: profileUrl || undefined,
    homeCountry,
    monetization,
    outlierPosts: storedOutlier.length
      ? storedOutlier
      : buildLegacyOutlierPosts(row),
    popularPosts: storedPopular.length
      ? storedPopular
      : buildLegacyPopularPosts(row, pageId),
    estimatedAvgViewsPerReel: row.avg_views_reel || undefined,
    estimatedAvgViewsPerImage: row.avg_views_image || undefined,
    estimatedAvgViewsPerText: row.avg_views_text || undefined,
  };
}

export function pageDatabaseRowToFacebookPageStats(
  rawRow: PageDatabaseRow | Record<string, unknown>
): FacebookPageStats {
  const row = normalizePageDatabaseRow(rawRow);

  if (!pageDatabaseRowHasFullScrape(row)) {
    return pageDatabaseRowToLegacyFacebookPageStats(row);
  }

  const homeCountry =
    row.country && row.country !== "Not listed" ? row.country : null;
  const popularPosts = row.popular_posts ?? [];
  const outlierPosts = row.outlier_posts ?? [];
  const reelViews = row.avg_views_reel;
  const imageViews = row.avg_views_image;
  const textViews = row.avg_views_text;
  const profileUrl = row.profile_picture_url?.trim();

  return {
    pageName: row.page_name,
    about: row.description ?? `Facebook page · ${row.category}`,
    followerCount: formatCount(row.followers),
    engagementRate: formatEngagementRateFromDatabase(row.engagement_rate),
    postsLast30Days: row.posts_last_30_days ?? Math.min(30, row.total_posts),
    postsThisMonth: row.posts_this_month ?? row.total_posts,
    postsToday: row.posts_today ?? 0,
    outlierScore: row.outlier_score,
    samplePostsAnalysis: row.sample_posts_analysis ?? false,
    profilePictureUrl: profileUrl || undefined,
    homeCountry,
    monetization: row.monetization!,
    outlierPosts,
    popularPosts: popularPosts.length > 0 ? popularPosts : undefined,
    estimatedAvgViewsPerReel: reelViews > 0 ? reelViews : undefined,
    estimatedAvgViewsPerImage: imageViews > 0 ? imageViews : undefined,
    estimatedAvgViewsPerText: textViews > 0 ? textViews : undefined,
  };
}

export async function fetchFreshCachedPage(
  searchQuery: string,
  maxAgeMs = PAGE_CACHE_MAX_AGE_MS
): Promise<PageDatabaseRow | null> {
  const trimmed = searchQuery.trim();
  if (!trimmed) return null;

  let urls: string[];
  try {
    urls = resolveFacebookPageUrls(trimmed).urls;
  } catch {
    return null;
  }

  if (urls.length === 0) return null;

  try {
    const supabase = await getReadClient();
    const { data, error } = await pagesDatabaseTable(supabase)
      .select("*")
      .in("page_url", urls)
      .order("last_scraped_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      logSupabaseError("fetchFreshCachedPage", error);
      return null;
    }

    if (!data) return null;

    const row = normalizePageDatabaseRow(
      data as Record<string, unknown>
    );
    const scrapedAt = new Date(row.last_scraped_at).getTime();
    if (!Number.isFinite(scrapedAt)) return null;

    const ageMs = Date.now() - scrapedAt;
    if (ageMs < 0 || ageMs >= maxAgeMs) return null;

    return row;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Cache lookup failed";
    console.warn("[fetchFreshCachedPage]", message);
    return null;
  }
}
