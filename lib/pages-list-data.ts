import { trendingPages, type TrendingPage } from "@/lib/discover-data";
import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";
import { calculateMonetizationIntel } from "@/lib/cpm-intelligence";
import { parseCountValue } from "@/lib/metrics";
import { calculateOutlierScoreFromStrings } from "@/lib/outlier-score";

export const POPULAR_POST_LIMIT = 4;

export const PAGE_FILTER_TABS = [
  "All Pages",
  "Outliers",
  "High Views Low Days",
  "Low Followers High Views",
  "Above 50K Avg Views",
  "New Pages",
  "Viral Posts",
] as const;

export type PageFilterTab = (typeof PAGE_FILTER_TABS)[number];

export type PageSortKey =
  | "followers"
  | "avgViewsPerReel"
  | "daysSinceStart"
  | "numberOfPosts"
  | "outlierScore";

export type PopularPost = {
  id: string;
  title: string;
  views: string;
  viewsRaw: number;
  timeAgo: string;
  thumbnailHue: number;
  /** Shown on thumbnail overlay — duration or post date */
  overlayLabel: string;
  thumbnailUrl?: string | null;
  likes: number;
  comments: number;
  shares: number;
  /** Weighted score: shares×3 + likes×1 + comments×2 */
  engagementScore: number;
};

/** Shares×3 + likes×1 + comments×2 */
export function calculatePostEngagementScore(
  likes: number,
  comments: number,
  shares: number
): number {
  return shares * 3 + likes + comments * 2;
}

export function sortPopularPostsByEngagement(posts: PopularPost[]): PopularPost[] {
  return [...posts]
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, POPULAR_POST_LIMIT);
}

export type PageListItem = {
  id: string;
  pageName: string;
  niche: string;
  searchQuery: string;
  profilePictureUrl: string;
  followerCount: string;
  followersRaw: number;
  avgViewsPerReel: string;
  avgViewsPerReelRaw: number;
  avgViewsPerImage: string;
  avgViewsPerImageRaw: number;
  avgViewsPerTextPost: string;
  avgViewsPerTextPostRaw: number;
  avgViewsPerReelEstimated?: boolean;
  avgViewsPerImageEstimated?: boolean;
  avgViewsPerTextPostEstimated?: boolean;
  daysSinceStart: number;
  numberOfPosts: number;
  outlierScore: number;
  /** Display multiplier e.g. 7.14x */
  outlierMultiplier: string;
  verified: boolean;
  monetized: boolean;
  popularPosts: PopularPost[];
  source?: TrendingPage["source"];
};

function hashSeed(id: string) {
  return id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function formatTimeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function toPopularPost(
  pageId: string,
  seed: number,
  index: number,
  input: {
    title: string;
    likes: number;
    comments: number;
    shares: number;
    timeAgo: string;
    overlayLabel: string;
    thumbnailUrl?: string | null;
  }
): PopularPost {
  const engagementScore = calculatePostEngagementScore(
    input.likes,
    input.comments,
    input.shares
  );
  const viewsRaw = input.likes + input.comments + input.shares;

  return {
    id: `${pageId}-post-${index}`,
    title: input.title,
    thumbnailUrl: input.thumbnailUrl ?? null,
    likes: input.likes,
    comments: input.comments,
    shares: input.shares,
    engagementScore,
    views: formatViews(viewsRaw),
    viewsRaw,
    timeAgo: input.timeAgo,
    thumbnailHue: (seed * 37 + index * 53) % 360,
    overlayLabel: input.overlayLabel,
  };
}

export function mapFeedPostsToPopularPosts(
  posts: ScrapedFacebookFeedPost[],
  pageId: string
): PopularPost[] {
  const seed = hashSeed(pageId);

  const mapped = posts.map((post, index) => {
    const title =
      post.text.length > 120 ? `${post.text.slice(0, 117)}…` : post.text;

    return toPopularPost(pageId, seed, index, {
      title,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares,
      timeAgo: formatTimeAgo(post.postedAtDate),
      overlayLabel: post.postedAt,
      thumbnailUrl: post.thumbnailUrl ?? null,
    });
  });

  return sortPopularPostsByEngagement(mapped).map((post, index) => ({
    ...post,
    id: `${pageId}-post-${index}`,
    thumbnailHue: (seed * 37 + index * 53) % 360,
  }));
}

function buildPopularPosts(page: TrendingPage, seed: number): PopularPost[] {
  const titles = [
    page.topPostPreview.slice(0, 72),
    "Behind-the-scenes reel fans are resharing",
    "Carousel post with record saves this week",
    "Live clip driving comment velocity",
  ];
  const times = ["2h ago", "1d ago", "3d ago", "5d ago"];
  const overlays = ["1:24", "Mar 12", "0:58", "Feb 28"];

  const posts = titles.map((title, index) => {
    const viewsRaw = Math.round(
      (80_000 + ((seed + index * 17) % 420)) * 1_000 * (1 + index * 0.35)
    );
    const likes = Math.max(500, Math.round(viewsRaw * 0.042 / (index + 1)));
    const comments = Math.max(40, Math.round(likes * (0.09 + index * 0.025)));
    const shares = Math.max(15, Math.round(likes * (0.035 + index * 0.012)));

    return toPopularPost(page.id, seed, index, {
      title,
      likes,
      comments,
      shares,
      timeAgo: times[index],
      overlayLabel: overlays[index],
    });
  });

  return sortPopularPostsByEngagement(posts).map((post, index) => ({
    ...post,
    id: `${page.id}-post-${index}`,
    thumbnailHue: (seed * 37 + index * 53) % 360,
  }));
}

export type EstimatedAvgViewsInput = {
  reel?: number;
  image?: number;
  text?: number;
};

export function enrichTrendingPage(
  page: TrendingPage,
  options?: {
    popularPosts?: PopularPost[];
    estimatedAvgViews?: EstimatedAvgViewsInput;
  }
): PageListItem {
  const seed = hashSeed(page.id);
  const followersRaw = parseCountValue(page.followerCount);
  const monetization = calculateMonetizationIntel({
    pageName: page.pageName,
    followerCount: page.followerCount,
    engagementRate: page.engagementRate,
    contentType: page.contentType,
    homeCountry: page.country === "Not listed" ? undefined : page.country,
    postsLast30Days: 8 + (seed % 24),
  });
  const outlierScore = calculateOutlierScoreFromStrings(
    page.followerCount,
    page.engagementRate,
    monetization.monetizationScore,
    8 + (seed % 24)
  );

  const avgViewsPerReelRaw = Math.round(
    (12_000 + (seed % 180) * 2_400) *
      (1 + parseCountValue(page.engagementRate.replace("%", "")) / 20)
  );
  const avgViewsPerImageRaw = Math.round(
    avgViewsPerReelRaw * (0.62 + (seed % 24) / 100)
  );
  const avgViewsPerTextPostRaw = Math.round(
    avgViewsPerReelRaw * (0.38 + (seed % 18) / 100)
  );

  const reelEstimate = options?.estimatedAvgViews?.reel;
  const imageEstimate = options?.estimatedAvgViews?.image;
  const textEstimate = options?.estimatedAvgViews?.text;

  const resolvedReelRaw =
    reelEstimate != null && reelEstimate > 0 ? reelEstimate : avgViewsPerReelRaw;
  const resolvedImageRaw =
    imageEstimate != null && imageEstimate > 0 ? imageEstimate : avgViewsPerImageRaw;
  const resolvedTextRaw =
    textEstimate != null && textEstimate > 0 ? textEstimate : avgViewsPerTextPostRaw;

  const daysSinceStart = 90 + (seed % 2_400);
  const numberOfPosts = 48 + (seed % 820);
  const outlierMultiplier = `${(3.5 + (outlierScore / 100) * 4.5 + (seed % 12) / 10).toFixed(2)}x`;

  return {
    id: page.id,
    pageName: page.pageName,
    niche: page.category,
    searchQuery: page.searchQuery,
    profilePictureUrl: page.profilePictureUrl,
    followerCount: page.followerCount,
    followersRaw,
    avgViewsPerReel: formatViews(resolvedReelRaw),
    avgViewsPerReelRaw: resolvedReelRaw,
    avgViewsPerImage: formatViews(resolvedImageRaw),
    avgViewsPerImageRaw: resolvedImageRaw,
    avgViewsPerTextPost: formatViews(resolvedTextRaw),
    avgViewsPerTextPostRaw: resolvedTextRaw,
    avgViewsPerReelEstimated:
      reelEstimate != null && reelEstimate > 0,
    avgViewsPerImageEstimated:
      imageEstimate != null && imageEstimate > 0,
    avgViewsPerTextPostEstimated:
      textEstimate != null && textEstimate > 0,
    daysSinceStart,
    numberOfPosts,
    outlierScore,
    outlierMultiplier,
    verified: followersRaw >= 5_000_000 || seed % 5 === 0,
    monetized:
      monetization.monetizationScore >= 55 || monetization.cpmTier !== "low",
    popularPosts: sortPopularPostsByEngagement(
      options?.popularPosts ?? buildPopularPosts(page, seed)
    ),
    source: page.source,
  };
}

export const pageListItems: PageListItem[] = trendingPages.map((page) =>
  enrichTrendingPage(page)
);

export function filterPagesByTab(
  pages: PageListItem[],
  tab: PageFilterTab
): PageListItem[] {
  if (tab === "All Pages") return pages;

  return pages.filter((page) => {
    switch (tab) {
      case "Outliers":
        return page.outlierScore >= 71;
      case "High Views Low Days":
        return page.avgViewsPerReelRaw >= 100_000 && page.daysSinceStart < 365;
      case "Low Followers High Views":
        return page.followersRaw < 1_000_000 && page.avgViewsPerReelRaw >= 50_000;
      case "Above 50K Avg Views":
        return page.avgViewsPerReelRaw >= 50_000;
      case "New Pages":
        return page.daysSinceStart < 180;
      case "Viral Posts":
        return page.popularPosts.some((post) => post.viewsRaw >= 1_000_000);
      default:
        return true;
    }
  });
}

export function sortPageList(
  pages: PageListItem[],
  key: PageSortKey,
  direction: "asc" | "desc"
): PageListItem[] {
  const sorted = [...pages].sort((a, b) => {
    const values: Record<PageSortKey, [number, number]> = {
      followers: [a.followersRaw, b.followersRaw],
      avgViewsPerReel: [a.avgViewsPerReelRaw, b.avgViewsPerReelRaw],
      daysSinceStart: [a.daysSinceStart, b.daysSinceStart],
      numberOfPosts: [a.numberOfPosts, b.numberOfPosts],
      outlierScore: [a.outlierScore, b.outlierScore],
    };
    const [left, right] = values[key];
    return left - right;
  });

  return direction === "desc" ? sorted.reverse() : sorted;
}

export function searchPageList(
  pages: PageListItem[],
  query: string
): PageListItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return pages;
  return pages.filter(
    (page) =>
      page.pageName.toLowerCase().includes(q) ||
      page.niche.toLowerCase().includes(q)
  );
}
