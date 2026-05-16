import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";
import {
  selectPostsForAverage,
  type PostAveragePeriodLabel,
} from "@/lib/post-average-period";

export type ScrapedTextPost = ScrapedFacebookFeedPost & {
  totalEngagement: number;
};

export type TextPostAnalytics = {
  posts: ScrapedTextPost[];
  /** Average likes + comments + shares per text post from feed scrape. */
  avgEngagementPerTextPost: number;
  avgPeriodLabel: PostAveragePeriodLabel;
};

function totalEngagement(post: ScrapedFacebookFeedPost): number {
  return post.likes + post.comments + post.shares;
}

export function analyzeTextPosts(
  posts: ScrapedFacebookFeedPost[]
): TextPostAnalytics | null {
  const textPosts = posts
    .filter((post) => post.postType === "text")
    .map((post) => ({
      ...post,
      totalEngagement: totalEngagement(post),
    }))
    .filter((post) => post.totalEngagement > 0);

  if (textPosts.length === 0) return null;

  const { posts: postsForAvg, periodLabel: avgPeriodLabel } =
    selectPostsForAverage(textPosts);

  const sumEngagement = postsForAvg.reduce(
    (sum, post) => sum + post.totalEngagement,
    0
  );
  const avgEngagementPerTextPost = Math.round(sumEngagement / postsForAvg.length);

  return {
    posts: textPosts,
    avgEngagementPerTextPost,
    avgPeriodLabel,
  };
}
