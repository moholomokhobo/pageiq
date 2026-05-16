import {
  buildFacebookPhotosTabUrl,
  buildFacebookReelsTabUrls,
} from "@/lib/facebook-page-url";

const POSTS_ACTOR = "apify~facebook-posts-scraper";
const APIFY_API_BASE = "https://api.apify.com/v2";
const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 90_000;
export const REELS_FETCH_LIMIT = 20;
export const PHOTOS_FETCH_LIMIT = 20;

export type FeedPostType = "reel" | "image" | "text";

export type ScrapedFacebookFeedPost = {
  text: string;
  likes: number;
  comments: number;
  shares: number;
  /** Play/view count when provided by Apify (reels) */
  viewCount?: number;
  postedAt: string;
  postedAtDate: Date;
  thumbnailUrl?: string;
  postType: FeedPostType;
  postUrl?: string;
};

type ApifyRunResponse = {
  data?: { id?: string; status?: string; defaultDatasetId?: string };
};

type ApifyRunStatusResponse = {
  data?: { status?: string; defaultDatasetId?: string };
};

type ApifyMediaItem = {
  __typename?: string;
  thumbnail?: string;
  url?: string;
  photo_image?: { uri?: string };
  image?: { uri?: string };
  video_thumbnail?: string;
  preferred_thumbnail?: { image?: { uri?: string } };
};

type ApifyFacebookPostRecord = {
  text?: string;
  message?: string;
  postText?: string;
  likes?: number;
  likesCount?: number;
  comments?: number;
  commentsCount?: number;
  shares?: number;
  sharesCount?: number;
  viewsCount?: number;
  viewCount?: number;
  views?: number | string;
  videoViewCount?: number;
  videoViews?: number;
  playCount?: number;
  timestamp?: number | string;
  time?: string;
  date?: string;
  type?: string;
  url?: string;
  topLevelUrl?: string;
  thumbnail?: string;
  fullPicture?: string;
  image?: string;
  media?: ApifyMediaItem[];
};

export function extractViewCountFromApifyRecord(
  record: Record<string, unknown>
): number {
  const candidates = [
    record.viewsCount,
    record.viewCount,
    record.views,
    record.videoViewCount,
    record.videoViews,
    record.playCount,
    record.play_count,
    record.view_count,
  ];

  for (const value of candidates) {
    if (value == null) continue;
    if (typeof value === "number" && Number.isFinite(value) && value > 0) {
      return Math.round(value);
    }
    if (typeof value === "string") {
      const cleaned = value.replace(/,/g, "").trim();
      const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
      if (match) {
        let num = parseFloat(match[1]);
        const suffix = (match[2] ?? "").toUpperCase();
        if (suffix === "K") num *= 1_000;
        if (suffix === "M") num *= 1_000_000;
        if (suffix === "B") num *= 1_000_000_000;
        if (Number.isFinite(num) && num > 0) return Math.round(num);
      }
      const parsed = parseFloat(cleaned);
      if (Number.isFinite(parsed) && parsed > 0) return Math.round(parsed);
    }
  }

  return 0;
}

function classifyFeedPostType(record: ApifyFacebookPostRecord): FeedPostType {
  const typeField = (record.type ?? "").toLowerCase();
  const postUrl = (record.topLevelUrl ?? record.url ?? "").toLowerCase();

  if (typeField.includes("reel") || postUrl.includes("/reel")) {
    return "reel";
  }

  const mediaTypes = (record.media ?? [])
    .map((item) => (item.__typename ?? "").toLowerCase())
    .filter(Boolean);

  if (
    typeField.includes("video") ||
    mediaTypes.some((name) => name.includes("video"))
  ) {
    return "reel";
  }

  if (
    extractThumbnail(record) ||
    typeField.includes("image") ||
    typeField.includes("photo") ||
    mediaTypes.some((name) => name.includes("photo") || name.includes("image"))
  ) {
    return "image";
  }

  return "text";
}

function apifyUrl(path: string, apiKey: string, query = ""): string {
  const token = `token=${encodeURIComponent(apiKey)}`;
  const extra = query ? `&${query}` : "";
  return `${APIFY_API_BASE}${path}?${token}${extra}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startApifyRun(
  pageUrl: string,
  apiKey: string,
  resultsLimit: number
): Promise<string | null> {
  const response = await fetch(apifyUrl(`/acts/${POSTS_ACTOR}/runs`, apiKey), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      startUrls: [{ url: pageUrl }],
      resultsLimit,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as ApifyRunResponse;
  return payload.data?.id ?? null;
}

async function waitForApifyRun(
  runId: string,
  apiKey: string
): Promise<string | null> {
  const deadline = Date.now() + MAX_WAIT_MS;

  while (Date.now() < deadline) {
    const response = await fetch(apifyUrl(`/actor-runs/${runId}`, apiKey));
    if (!response.ok) return null;

    const payload = (await response.json()) as ApifyRunStatusResponse;
    const status = payload.data?.status;

    if (status === "SUCCEEDED") {
      return payload.data?.defaultDatasetId ?? null;
    }

    if (
      status === "FAILED" ||
      status === "TIMED-OUT" ||
      status === "ABORTED" ||
      status === "TIMING-OUT"
    ) {
      return null;
    }

    await sleep(POLL_INTERVAL_MS);
  }

  return null;
}

async function fetchDatasetItems(
  datasetId: string,
  apiKey: string
): Promise<ApifyFacebookPostRecord[]> {
  const response = await fetch(apifyUrl(`/datasets/${datasetId}/items`, apiKey));
  if (!response.ok) return [];

  const items = (await response.json()) as ApifyFacebookPostRecord[];
  return Array.isArray(items) ? items : [];
}

function parsePostDate(raw?: number | string): Date {
  if (typeof raw === "number") {
    const ms = raw > 1_000_000_000_000 ? raw : raw * 1000;
    return new Date(ms);
  }

  if (raw) {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return new Date();
}

function extractThumbnail(record: ApifyFacebookPostRecord): string | undefined {
  const direct = [record.thumbnail, record.fullPicture, record.image]
    .map((value) => value?.trim())
    .find((value) => value?.startsWith("http"));
  if (direct) return direct;

  for (const item of record.media ?? []) {
    const candidates = [
      item.thumbnail,
      item.photo_image?.uri,
      item.image?.uri,
      item.video_thumbnail,
      item.preferred_thumbnail?.image?.uri,
      item.url?.startsWith("http") && item.url.includes("fbcdn") ? item.url : undefined,
    ];
    const found = candidates
      .map((value) => value?.trim())
      .find((value) => value?.startsWith("http"));
    if (found) return found;
  }

  return undefined;
}

function mapPostRecord(
  record: ApifyFacebookPostRecord,
  options?: { allowEmptyCaption?: boolean }
): ScrapedFacebookFeedPost | null {
  let text =
    record.text?.trim() ||
    record.message?.trim() ||
    record.postText?.trim() ||
    "";

  if (!text && options?.allowEmptyCaption) {
    text = "Photo";
  }

  if (!text) return null;

  const likes = Number(record.likes ?? record.likesCount ?? 0) || 0;
  const comments = Number(record.comments ?? record.commentsCount ?? 0) || 0;
  const shares = Number(record.shares ?? record.sharesCount ?? 0) || 0;
  const postedAtDate = parsePostDate(record.timestamp ?? record.time ?? record.date);
  const postUrl = [record.topLevelUrl, record.url]
    .map((value) => value?.trim())
    .find((value) => value?.startsWith("http"));

  const viewCount = extractViewCountFromApifyRecord(
    record as Record<string, unknown>
  );

  return {
    text,
    likes,
    comments,
    shares,
    viewCount: viewCount > 0 ? viewCount : undefined,
    postedAt: postedAtDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    postedAtDate,
    thumbnailUrl: extractThumbnail(record),
    postType: classifyFeedPostType(record),
    postUrl,
  };
}

/**
 * Fetches the latest posts for a Facebook page via apify/facebook-posts-scraper.
 * Returns an empty array when the run fails.
 */
async function scrapePostsFromUrl(
  pageUrl: string,
  apiKey: string,
  resultsLimit: number,
  mapOptions?: { allowEmptyCaption?: boolean }
): Promise<ScrapedFacebookFeedPost[]> {
  const runId = await startApifyRun(pageUrl, apiKey, resultsLimit);
  if (!runId) return [];

  const datasetId = await waitForApifyRun(runId, apiKey);
  if (!datasetId) return [];

  const items = await fetchDatasetItems(datasetId, apiKey);
  return items
    .map((item) => mapPostRecord(item, mapOptions))
    .filter((post): post is ScrapedFacebookFeedPost => post !== null)
    .sort((a, b) => b.postedAtDate.getTime() - a.postedAtDate.getTime())
    .slice(0, resultsLimit);
}

/**
 * Fetches the latest posts for a Facebook page via apify/facebook-posts-scraper.
 */
export async function scrapeFacebookPagePosts(
  pageUrl: string,
  apiKey: string,
  resultsLimit = 4
): Promise<ScrapedFacebookFeedPost[]> {
  return scrapePostsFromUrl(pageUrl, apiKey, resultsLimit);
}

function normalizeScrapedReelPosts(
  posts: ScrapedFacebookFeedPost[]
): ScrapedFacebookFeedPost[] {
  return posts
    .map((post) => ({
      ...post,
      postType:
        post.postType === "reel" || (post.viewCount ?? 0) > 0
          ? ("reel" as const)
          : post.postType,
    }))
    .filter(
      (post) =>
        post.postType === "reel" ||
        (post.postUrl?.includes("/reel/") ?? false) ||
        (post.viewCount ?? 0) > 0
    );
}

/**
 * Scrapes the page Reels tab — returns reel posts with view counts when available.
 * Tries /reels first, then ?sk=videos_reels for profile-style pages.
 */
export async function scrapeFacebookPageReels(
  pageUrl: string,
  apiKey: string,
  resultsLimit = REELS_FETCH_LIMIT
): Promise<ScrapedFacebookFeedPost[]> {
  const candidateUrls = buildFacebookReelsTabUrls(pageUrl);

  console.log("[Apify Reels] Base page URL:", pageUrl);
  console.log("[Apify Reels] Candidate Reels tab URLs:", candidateUrls);

  for (let index = 0; index < candidateUrls.length; index += 1) {
    const reelsTabUrl = candidateUrls[index];
    const isFallback = index > 0;

    console.log(
      `[Apify Reels] Passing URL to facebook-posts-scraper (${isFallback ? "fallback" : "primary"}):`,
      reelsTabUrl
    );

    const posts = await scrapePostsFromUrl(reelsTabUrl, apiKey, resultsLimit);
    const reels = normalizeScrapedReelPosts(posts);

    if (reels.length > 0) {
      console.log(
        "[Apify Reels] Scrape succeeded with URL:",
        reelsTabUrl,
        `(${reels.length} reels)`
      );
      return reels;
    }

    console.log(
      "[Apify Reels] No reels returned from URL,",
      isFallback ? "giving up" : "trying fallback format"
    );
  }

  return [];
}

function normalizeScrapedPhotoPosts(
  posts: ScrapedFacebookFeedPost[]
): ScrapedFacebookFeedPost[] {
  return posts
    .map((post) => ({
      ...post,
      postType: "image" as const,
    }))
    .filter(
      (post) =>
        post.postType === "image" ||
        post.thumbnailUrl ||
        post.postUrl?.includes("/photo") ||
        post.likes + post.comments + post.shares > 0
    );
}

/**
 * Scrapes the page Photos tab at /{page}/photos_by/.
 */
export async function scrapeFacebookPagePhotos(
  pageUrl: string,
  apiKey: string,
  resultsLimit = PHOTOS_FETCH_LIMIT
): Promise<ScrapedFacebookFeedPost[]> {
  const photosTabUrl = buildFacebookPhotosTabUrl(pageUrl);

  console.log("[Apify Photos] Base page URL:", pageUrl);
  console.log(
    "[Apify Photos] Passing URL to facebook-posts-scraper:",
    photosTabUrl
  );

  const posts = await scrapePostsFromUrl(photosTabUrl, apiKey, resultsLimit, {
    allowEmptyCaption: true,
  });
  const photos = normalizeScrapedPhotoPosts(posts);

  if (photos.length > 0) {
    console.log(
      "[Apify Photos] Scrape succeeded with URL:",
      photosTabUrl,
      `(${photos.length} photos)`
    );
  } else {
    console.log("[Apify Photos] No photos returned from URL:", photosTabUrl);
  }

  return photos;
}
