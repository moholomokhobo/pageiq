const POSTS_ACTOR = "apify~facebook-posts-scraper";
const APIFY_API_BASE = "https://api.apify.com/v2";
const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 90_000;

export type FeedPostType = "reel" | "image" | "text";

export type ScrapedFacebookFeedPost = {
  text: string;
  likes: number;
  comments: number;
  shares: number;
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

function mapPostRecord(record: ApifyFacebookPostRecord): ScrapedFacebookFeedPost | null {
  const text =
    record.text?.trim() ||
    record.message?.trim() ||
    record.postText?.trim() ||
    "";

  if (!text) return null;

  const likes = Number(record.likes ?? record.likesCount ?? 0) || 0;
  const comments = Number(record.comments ?? record.commentsCount ?? 0) || 0;
  const shares = Number(record.shares ?? record.sharesCount ?? 0) || 0;
  const postedAtDate = parsePostDate(record.timestamp ?? record.time ?? record.date);
  const postUrl = [record.topLevelUrl, record.url]
    .map((value) => value?.trim())
    .find((value) => value?.startsWith("http"));

  return {
    text,
    likes,
    comments,
    shares,
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
export async function scrapeFacebookPagePosts(
  pageUrl: string,
  apiKey: string,
  resultsLimit = 4
): Promise<ScrapedFacebookFeedPost[]> {
  const runId = await startApifyRun(pageUrl, apiKey, resultsLimit);
  if (!runId) return [];

  const datasetId = await waitForApifyRun(runId, apiKey);
  if (!datasetId) return [];

  const items = await fetchDatasetItems(datasetId, apiKey);
  return items
    .map(mapPostRecord)
    .filter((post): post is ScrapedFacebookFeedPost => post !== null)
    .sort((a, b) => b.postedAtDate.getTime() - a.postedAtDate.getTime())
    .slice(0, resultsLimit);
}
