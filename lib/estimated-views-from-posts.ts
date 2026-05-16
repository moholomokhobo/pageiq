import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";

export type EstimatedViewsByPostType = {
  estimatedAvgViewsPerReel: number;
  estimatedAvgViewsPerImage: number;
  estimatedAvgViewsPerText: number;
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
): number | undefined {
  const averages = averageEngagement(posts);
  if (!averages || averages.likes <= 0) return undefined;
  return Math.round(averages.likes * multiplier);
}

/**
 * Groups Apify feed posts by type, averages engagement per type, and estimates
 * views from average likes using Facebook-like-to-view ratios.
 */
export function calculateEstimatedViewsFromFeedPosts(
  posts: ScrapedFacebookFeedPost[]
): Partial<EstimatedViewsByPostType> | null {
  if (posts.length === 0) return null;

  const reels = posts.filter((post) => post.postType === "reel");
  const images = posts.filter((post) => post.postType === "image");
  const texts = posts.filter((post) => post.postType === "text");

  const estimatedAvgViewsPerReel = estimatedViewsForType(
    reels,
    VIEW_MULTIPLIERS.reel
  );
  const estimatedAvgViewsPerImage = estimatedViewsForType(
    images,
    VIEW_MULTIPLIERS.image
  );
  const estimatedAvgViewsPerText = estimatedViewsForType(
    texts,
    VIEW_MULTIPLIERS.text
  );

  if (
    estimatedAvgViewsPerReel == null &&
    estimatedAvgViewsPerImage == null &&
    estimatedAvgViewsPerText == null
  ) {
    return null;
  }

  return {
    ...(estimatedAvgViewsPerReel != null
      ? { estimatedAvgViewsPerReel }
      : {}),
    ...(estimatedAvgViewsPerImage != null
      ? { estimatedAvgViewsPerImage }
      : {}),
    ...(estimatedAvgViewsPerText != null ? { estimatedAvgViewsPerText } : {}),
  };
}
