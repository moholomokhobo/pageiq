import type { ScrapedFacebookFeedPost } from "@/lib/facebook-posts-apify";
import {
  selectPostsForAverage,
  type PostAveragePeriodLabel,
} from "@/lib/post-average-period";

export type ScrapedPhoto = ScrapedFacebookFeedPost & {
  totalEngagement: number;
};

export type PhotoAnalytics = {
  photos: ScrapedPhoto[];
  /** Average likes + comments + shares per photo from the Photos tab. */
  avgEngagementPerImage: number;
  avgPeriodLabel: PostAveragePeriodLabel;
};

function totalEngagement(post: ScrapedFacebookFeedPost): number {
  return post.likes + post.comments + post.shares;
}

export function analyzePhotos(
  posts: ScrapedFacebookFeedPost[]
): PhotoAnalytics | null {
  const photos = posts
    .map((post) => ({
      ...post,
      postType: "image" as const,
      totalEngagement: totalEngagement(post),
    }))
    .filter((photo) => photo.totalEngagement > 0);

  if (photos.length === 0) return null;

  const { posts: photosForAvg, periodLabel: avgPeriodLabel } =
    selectPostsForAverage(photos);

  const sumEngagement = photosForAvg.reduce(
    (sum, photo) => sum + photo.totalEngagement,
    0
  );
  const avgEngagementPerImage = Math.round(sumEngagement / photosForAvg.length);

  return {
    photos,
    avgEngagementPerImage,
    avgPeriodLabel,
  };
}

export function logApifyPhotoSample(
  label: string,
  posts: ScrapedFacebookFeedPost[]
) {
  const images = posts.filter((p) => p.postType === "image");
  console.log(`[Apify Photos] ${label}`, {
    totalPosts: posts.length,
    photoCount: images.length,
    sample: images.slice(0, 3).map((photo) => ({
      likes: photo.likes,
      comments: photo.comments,
      shares: photo.shares,
      engagement: photo.likes + photo.comments + photo.shares,
      thumbnailUrl: photo.thumbnailUrl ?? null,
      caption: photo.text.slice(0, 80) || "(no caption)",
      postUrl: photo.postUrl,
      postedAt: photo.postedAt,
    })),
  });
}
