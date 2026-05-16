import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";
import {
  selectPostsForAverage,
  type PostAveragePeriodLabel,
} from "@/lib/post-average-period";

export type EstimatedViewsByPostType = {
  estimatedAvgViewsPerReel?: number;
  estimatedAvgViewsPerImage?: number;
  estimatedAvgViewsPerText?: number;
  reelAvgPeriod?: PostAveragePeriodLabel;
  imageAvgPeriod?: PostAveragePeriodLabel;
  textAvgPeriod?: PostAveragePeriodLabel;
};

const VIEW_MULTIPLIERS = {
  reel: 40,
  image: 25,
  text: 15,
} as const;

type EngagementAverages = {
  likes: number;
  comments: number;
  shares: number;
};

function averageEngagement(
  posts: ScrapedFacebookFeedPost[]
): EngagementAverages | null {
  if (posts.length === 0) return null;

  const totals = posts.reduce(
    (acc, post) => ({
      likes: acc.likes + post.likes,
      comments: acc.comments + post.comments,
      shares: acc.shares + post.shares,
    }),
    { likes: 0, comments: 0, shares: 0 }
  );

  const count = posts.length;
  return {
    likes: totals.likes / count,
    comments: totals.comments / count,
    shares: totals.shares / count,
  };
}

function estimatedViewsForType(
  posts: ScrapedFacebookFeedPost[],
  multiplier: number
): { value: number; periodLabel: PostAveragePeriodLabel } | undefined {
  if (posts.length === 0) return undefined;

  const { posts: postsForAvg, periodLabel } = selectPostsForAverage(posts);
  const averages = averageEngagement(postsForAvg);
  if (!averages || averages.likes <= 0) return undefined;

  return {
    value: Math.round(averages.likes * multiplier),
    periodLabel,
  };
}

/**
 * Groups Apify feed posts by type, averages engagement per type (30d window when
 * enough posts), and estimates views from average likes using ratios.
 */
export function calculateEstimatedViewsFromFeedPosts(
  posts: ScrapedFacebookFeedPost[]
): Partial<EstimatedViewsByPostType> | null {
  if (posts.length === 0) return null;

  const reels = posts.filter((post) => post.postType === "reel");
  const images = posts.filter((post) => post.postType === "image");
  const texts = posts.filter((post) => post.postType === "text");

  const reelEstimate = estimatedViewsForType(reels, VIEW_MULTIPLIERS.reel);
  const imageEstimate = estimatedViewsForType(images, VIEW_MULTIPLIERS.image);
  const textEstimate = estimatedViewsForType(texts, VIEW_MULTIPLIERS.text);

  if (!reelEstimate && !imageEstimate && !textEstimate) {
    return null;
  }

  return {
    ...(reelEstimate
      ? {
          estimatedAvgViewsPerReel: reelEstimate.value,
          reelAvgPeriod: reelEstimate.periodLabel,
        }
      : {}),
    ...(imageEstimate
      ? {
          estimatedAvgViewsPerImage: imageEstimate.value,
          imageAvgPeriod: imageEstimate.periodLabel,
        }
      : {}),
    ...(textEstimate
      ? {
          estimatedAvgViewsPerText: textEstimate.value,
          textAvgPeriod: textEstimate.periodLabel,
        }
      : {}),
  };
}
