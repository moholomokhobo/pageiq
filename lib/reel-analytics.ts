import { formatCount, type OutlierPostResult } from "@/lib/facebook-scraper-core";
import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";
import {
  mapFeedPostsToPopularPosts,
  type PopularPost,
} from "@/lib/pages-list-data";
import {
  selectPostsForAverage,
  type PostAveragePeriodLabel,
} from "@/lib/post-average-period";

export type ScrapedReel = ScrapedFacebookFeedPost & {
  viewCount: number;
};

export type ReelAnalytics = {
  reels: ScrapedReel[];
  avgViewsPerReel: number;
  avgPeriodLabel: PostAveragePeriodLabel;
  /** Mean of per-reel (likes + comments + shares) / views × 100 */
  avgEngagementRatePercent: number;
  outlierReels: ScrapedReel[];
  popularPosts: PopularPost[];
  outlierPosts: OutlierPostResult[];
};

const OUTLIER_VIEW_MULTIPLIER = 3;

export function toScrapedReel(post: ScrapedFacebookFeedPost): ScrapedReel {
  return {
    ...post,
    postType: "reel",
    viewCount: post.viewCount ?? 0,
  };
}

function reelEngagementRatePercent(reel: ScrapedReel): number {
  if (reel.viewCount <= 0) return 0;
  const engagement = reel.likes + reel.comments + reel.shares;
  return Number(((engagement / reel.viewCount) * 100).toFixed(2));
}

export function analyzeReels(
  posts: ScrapedFacebookFeedPost[],
  pageId: string
): ReelAnalytics | null {
  const reels = posts
    .filter((post) => post.postType === "reel" || (post.viewCount ?? 0) > 0)
    .map((post) =>
      toScrapedReel({
        ...post,
        postType: "reel",
        viewCount: post.viewCount ?? 0,
      })
    )
    .filter((reel) => reel.text.trim().length > 0);

  const reelsWithViews = reels.filter((reel) => reel.viewCount > 0);
  if (reelsWithViews.length === 0) return null;

  const { posts: reelsForAvg, periodLabel: avgPeriodLabel } =
    selectPostsForAverage(reelsWithViews);

  const totalViews = reelsForAvg.reduce((sum, reel) => sum + reel.viewCount, 0);
  const avgViewsPerReel = Math.round(totalViews / reelsForAvg.length);

  const perReelRates = reelsForAvg.map(reelEngagementRatePercent);
  const avgEngagementRatePercent =
    perReelRates.reduce((sum, rate) => sum + rate, 0) / perReelRates.length;

  const outlierThreshold = avgViewsPerReel * OUTLIER_VIEW_MULTIPLIER;
  const outlierReels = reelsWithViews.filter(
    (reel) => reel.viewCount >= outlierThreshold
  );

  const outlierIds = new Set(
    outlierReels.map((reel) => reel.postUrl ?? reel.text.slice(0, 80))
  );

  const popularPosts = mapFeedPostsToPopularPosts(reels, pageId, {
    outlierKeys: outlierIds,
    avgReelViews: avgViewsPerReel,
  });

  const outlierPosts: OutlierPostResult[] = outlierReels
    .map((reel) => {
      const multiplier = reel.viewCount / avgViewsPerReel;
      return {
        preview:
          reel.text.length > 120 ? `${reel.text.slice(0, 117)}…` : reel.text,
        likes: formatCount(reel.likes),
        comments: formatCount(reel.comments),
        shares: formatCount(reel.shares),
        type: "reel" as const,
        multiplier: `${multiplier.toFixed(1)}x`,
        totalEngagement: formatCount(reel.likes + reel.comments + reel.shares),
        postedAt: reel.postedAt,
      };
    })
    .sort((a, b) => parseFloat(b.multiplier) - parseFloat(a.multiplier));

  return {
    reels,
    avgViewsPerReel,
    avgPeriodLabel,
    avgEngagementRatePercent,
    outlierReels,
    popularPosts,
    outlierPosts,
  };
}

export function logApifyReelSample(
  label: string,
  posts: ScrapedFacebookFeedPost[]
) {
  const reels = posts.filter((p) => p.postType === "reel");
  console.log(`[Apify Reels] ${label}`, {
    totalPosts: posts.length,
    reelCount: reels.length,
    sample: reels.slice(0, 3).map((reel) => ({
      views: reel.viewCount,
      likes: reel.likes,
      comments: reel.comments,
      shares: reel.shares,
      thumbnailUrl: reel.thumbnailUrl ?? null,
      caption: reel.text.slice(0, 80),
      postUrl: reel.postUrl,
      postedAt: reel.postedAt,
    })),
  });
}
