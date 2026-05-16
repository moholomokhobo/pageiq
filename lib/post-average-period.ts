/** Subtitle shown under reel / image / text stat averages. */
export type PostAveragePeriodLabel = "30d avg" | "recent avg";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_POSTS_FOR_30D_AVG = 3;

export function isWithinLast30Days(date: Date, now = new Date()): boolean {
  return date.getTime() >= now.getTime() - THIRTY_DAYS_MS;
}

/**
 * Prefer posts from the last 30 days when at least `minRecentCount` qualify;
 * otherwise use all available posts ("recent avg").
 */
export function selectPostsForAverage<T extends { postedAtDate: Date }>(
  posts: T[],
  minRecentCount = MIN_POSTS_FOR_30D_AVG
): { posts: T[]; periodLabel: PostAveragePeriodLabel } {
  if (posts.length === 0) {
    return { posts: [], periodLabel: "recent avg" };
  }

  const now = new Date();
  const last30d = posts.filter((post) =>
    isWithinLast30Days(post.postedAtDate, now)
  );

  if (last30d.length >= minRecentCount) {
    return { posts: last30d, periodLabel: "30d avg" };
  }

  return { posts, periodLabel: "recent avg" };
}
