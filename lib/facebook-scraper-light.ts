import { calculateEstimatedViewsFromFeedPosts } from "@/lib/estimated-views-from-posts";
import {
  scrapeFacebookPagePosts,
  type ScrapedFacebookFeedPost,
} from "@/lib/facebook-posts-apify";
import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import {
  extractCountryFromApifyRecord,
  pickApifyLocationFields,
} from "@/lib/page-country";
import {
  mapFeedPostsToPopularPosts,
  POPULAR_POST_LIMIT,
} from "@/lib/pages-list-data";
import { inferCategoryFromPageName } from "@/lib/discover-live";
import {
  buildPageStats,
  buildPageStatsFromPosts,
  calculateEngagementRate,
  calculateOutlierScore,
  estimateFollowersFromName,
  generateMockPosts,
  parseCountToken,
  type FacebookPageStats,
  type PostType,
  type ScrapedPost,
} from "@/lib/facebook-scraper-core";
import { persistScrapedPageToDatabase } from "@/lib/persist-scraped-page";

const APIFY_ACTOR = "apify~facebook-pages-scraper";
/** Fetch enough posts to estimate per-type averages */
const POSTS_FETCH_LIMIT = 20;
const APIFY_API_BASE = "https://api.apify.com/v2";
const POLL_INTERVAL_MS = 3_000;
const MAX_WAIT_MS = 90_000;

type ApifyRunResponse = {
  data?: { id?: string; status?: string; defaultDatasetId?: string };
  error?: { message?: string };
};

type ApifyRunStatusResponse = {
  data?: {
    status?: string;
    defaultDatasetId?: string;
  };
  error?: { message?: string };
};

type ApifyPostRecord = {
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
  url?: string;
  type?: string;
};

type ApifyPageRecord = {
  title?: string;
  pageName?: string;
  intro?: string;
  description?: string;
  about_me?: { text?: string };
  followers?: number;
  likes?: number;
  categories?: string[];
  info?: string[];
  profilePictureUrl?: string;
  profilePhoto?: string;
  coverPhotoUrl?: string;
  profile_picture_url?: string;
  profilePicUrl?: string;
  image?: string;
  picture?: string;
  personalProfile?: unknown;
  city?: unknown;
  country?: unknown;
  location?: unknown;
  address?: unknown;
  place?: unknown;
  homeTown?: unknown;
  hometown?: unknown;
  currentCity?: unknown;
  current_city?: unknown;
  home_town?: unknown;
  state?: unknown;
  region?: unknown;
  pageAddress?: unknown;
  addressStreet?: unknown;
  posts?: ApifyPostRecord[];
  recentPosts?: ApifyPostRecord[];
};

function apifyUrl(path: string, apiKey: string, query = ""): string {
  const token = `token=${encodeURIComponent(apiKey)}`;
  const extra = query ? `&${query}` : "";
  return `${APIFY_API_BASE}${path}?${token}${extra}`;
}

async function startApifyRun(
  pageUrl: string,
  apiKey: string
): Promise<string | null> {
  const response = await fetch(
    apifyUrl(`/acts/${APIFY_ACTOR}/runs`, apiKey),
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startUrls: [{ url: pageUrl }],
      }),
    }
  );

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
): Promise<ApifyPageRecord[]> {
  const response = await fetch(
    apifyUrl(`/datasets/${datasetId}/items`, apiKey)
  );

  if (!response.ok) return [];

  const items = (await response.json()) as ApifyPageRecord[];
  return Array.isArray(items) ? items : [];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseTalkingAbout(info: string[] = []): number {
  for (const line of info) {
    const match = line.match(/([\d,.]+[KMB]?)\s+talking about this/i);
    if (match?.[1]) {
      return parseCountToken(match[1]);
    }
  }
  return 0;
}

/** Apify may return profilePhoto as a facebook.com/photo page — not usable in <img src>. */
function isDirectImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (
      parsed.hostname.includes("facebook.com") &&
      parsed.pathname.includes("/photo")
    ) {
      return false;
    }
    if (parsed.hostname.includes("fbcdn.net")) return true;
    if (/\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(parsed.pathname)) return true;
    return url.startsWith("http");
  } catch {
    return false;
  }
}

function pickImageUrlFromUnknown(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return isDirectImageUrl(trimmed) ? trimmed : undefined;
  }
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const obj = value as Record<string, unknown>;
    for (const key of [
      "uri",
      "url",
      "src",
      "href",
      "profilePictureUrl",
      "small",
      "medium",
      "large",
    ]) {
      const nested = pickImageUrlFromUnknown(obj[key]);
      if (nested) return nested;
    }
  }
  return undefined;
}

function extractProfilePictureUrl(record: ApifyPageRecord): string | undefined {
  const raw = record as Record<string, unknown>;
  const candidates: unknown[] = [
    record.profilePictureUrl,
    raw.profile_picture_url,
    raw.profilePicUrl,
    raw.profile_pic_url,
    raw.image,
    raw.picture,
    raw.avatar,
    raw.pageProfilePicture,
    raw.personalProfile,
  ];

  for (const candidate of candidates) {
    const url = pickImageUrlFromUnknown(candidate);
    if (url) return url;
  }

  return undefined;
}

function logApifyProfileAndPostsFields(
  record: ApifyPageRecord,
  pageLabel: string
) {
  const raw = record as Record<string, unknown>;
  const mediaKeys = Object.keys(raw).filter((key) =>
    /profile|picture|photo|image|avatar|cover/i.test(key)
  );
  const mediaSnapshot = Object.fromEntries(
    mediaKeys.map((key) => [key, raw[key]])
  );

  const pagePosts = [...(record.posts ?? []), ...(record.recentPosts ?? [])];

  console.log("[Apify] Profile / media fields for", pageLabel, {
    mediaSnapshot,
    extractedProfilePictureUrl: extractProfilePictureUrl(record),
    profilePictureUrl: record.profilePictureUrl ?? null,
    profilePhoto: record.profilePhoto ?? null,
    coverPhotoUrl: record.coverPhotoUrl ?? null,
    pagePostsCount: pagePosts.length,
    pagePostsSample: pagePosts.slice(0, 2).map((post) => ({
      text: (post.text ?? post.message ?? post.postText ?? "").slice(0, 80),
      likes: post.likes ?? post.likesCount,
      url: post.url,
      type: post.type,
    })),
  });
}

function extractCategoryFromApifyRecord(
  record: ApifyPageRecord,
  pageName: string
): string {
  const cats = record.categories?.filter((c) => c && c !== "Page");
  if (cats?.length) return cats[0];
  return inferCategoryFromPageName(pageName);
}

function composeAbout(record: ApifyPageRecord): string {
  const parts: string[] = [];

  if (record.intro?.trim()) parts.push(record.intro.trim());
  if (record.about_me?.text?.trim()) parts.push(record.about_me.text.trim());

  if (record.categories?.length) {
    const cats = record.categories.filter((c) => c && c !== "Page");
    if (cats.length) parts.push(`Category: ${cats.join(", ")}`);
  }

  return parts.join(" · ");
}

function normalizePostType(raw?: string): PostType {
  const value = (raw ?? "").toLowerCase();
  if (value.includes("reel")) return "reel";
  if (value.includes("video")) return "video";
  if (value.includes("image") || value.includes("photo")) return "image";
  return "text";
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

  const daysAgo = Math.floor(Math.random() * 20) + 1;
  return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
}

function mapApifyPosts(
  records: ApifyPostRecord[],
  pageName: string
): ScrapedPost[] {
  const posts = records
    .map((record) => {
      const preview =
        record.text?.trim() ||
        record.message?.trim() ||
        record.postText?.trim() ||
        "";

      if (!preview) return null;

      const likes = Number(record.likes ?? record.likesCount ?? 0) || 0;
      const comments =
        Number(record.comments ?? record.commentsCount ?? 0) || 0;
      const shares = Number(record.shares ?? record.sharesCount ?? 0) || 0;
      const postedAtDate = parsePostDate(
        record.timestamp ?? record.time ?? record.date
      );

      return {
        preview,
        likes,
        comments,
        shares,
        type: normalizePostType(record.type),
        totalEngagement: likes + comments + shares,
        postedAt: postedAtDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        postedAtDate,
      } satisfies ScrapedPost;
    })
    .filter((post): post is ScrapedPost => post !== null)
    .sort((a, b) => b.postedAtDate.getTime() - a.postedAtDate.getTime());

  return posts.slice(0, 20);
}

function buildStatsFromApifyRecord(
  record: ApifyPageRecord,
  fallbackName: string
): FacebookPageStats | null {
  const pageName = record.title?.trim() || record.pageName?.trim() || fallbackName;
  const followers = Number(record.followers ?? 0) || Number(record.likes ?? 0);

  if (!pageName && followers === 0) return null;

  const about =
    composeAbout(record) ||
    `Facebook page · ${pageName}`;

  const resolvedFollowers =
    followers > 0 ? followers : estimateFollowersFromName(pageName);

  const apifyPosts = [
    ...(record.posts ?? []),
    ...(record.recentPosts ?? []),
  ];

  let posts: ScrapedPost[];
  let samplePostsAnalysis = true;

  if (apifyPosts.length > 0) {
    posts = mapApifyPosts(apifyPosts, pageName);
    samplePostsAnalysis = false;
  } else {
    posts = generateMockPosts(pageName, resolvedFollowers, about);
  }

  if (posts.length === 0) {
    posts = generateMockPosts(pageName, resolvedFollowers, about);
    samplePostsAnalysis = true;
  }

  const profilePictureUrl = extractProfilePictureUrl(record);
  const pageLabel =
    record.title?.trim() || record.pageName?.trim() || fallbackName;

  console.log(
    "[Apify location] raw fields for",
    pageLabel,
    JSON.stringify(pickApifyLocationFields(record as Record<string, unknown>), null, 2)
  );

  const homeCountry = extractCountryFromApifyRecord(record);

  console.log(
    "[Apify location] extracted country for",
    pageLabel,
    ":",
    homeCountry ?? "(none)"
  );

  const stats = buildPageStatsFromPosts(
    pageName,
    about,
    resolvedFollowers,
    posts,
    samplePostsAnalysis,
    profilePictureUrl,
    homeCountry ?? undefined
  );

  const talkingAbout = parseTalkingAbout(record.info);
  if (talkingAbout > 0 && resolvedFollowers > 0 && samplePostsAnalysis) {
    const proxyRate = (talkingAbout / resolvedFollowers) * 100 * 2.5;
    const engagementRate = Math.min(
      15,
      Math.max(0.1, Number(proxyRate.toFixed(1)))
    );
    return {
      ...stats,
      homeCountry,
      engagementRate: `${engagementRate}%`,
      outlierScore: calculateOutlierScore(
        resolvedFollowers,
        engagementRate,
        stats.monetization.monetizationScore,
        stats.postsLast30Days
      ),
    };
  }

  return { ...stats, homeCountry };
}

function livePageId(searchQuery: string) {
  return `live-${searchQuery
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function apifyPagePostToFeedPost(
  record: ApifyPostRecord
): ScrapedFacebookFeedPost | null {
  const text =
    record.text?.trim() ||
    record.message?.trim() ||
    record.postText?.trim() ||
    "";

  if (!text) return null;

  const likes = Number(record.likes ?? record.likesCount ?? 0) || 0;
  const comments = Number(record.comments ?? record.commentsCount ?? 0) || 0;
  const shares = Number(record.shares ?? record.sharesCount ?? 0) || 0;
  const postedAtDate = parsePostDate(
    record.timestamp ?? record.time ?? record.date
  );
  const postType = normalizePostType(record.type);
  const feedType: ScrapedFacebookFeedPost["postType"] =
    postType === "reel" ? "reel" : postType === "image" ? "image" : "text";

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
    postType: feedType,
    postUrl: record.url?.trim().startsWith("http") ? record.url.trim() : undefined,
  };
}

function popularPostsFromApifyPageRecord(
  record: ApifyPageRecord,
  searchQuery: string
): FacebookPageStats["popularPosts"] {
  const pagePosts = [...(record.posts ?? []), ...(record.recentPosts ?? [])];
  const feedPosts = pagePosts
    .map((post) => apifyPagePostToFeedPost(post))
    .filter((post): post is ScrapedFacebookFeedPost => post != null);

  if (feedPosts.length === 0) return undefined;

  return mapFeedPostsToPopularPosts(feedPosts, livePageId(searchQuery));
}

async function attachPopularPosts(
  stats: FacebookPageStats,
  pageUrl: string,
  searchQuery: string,
  apiKey: string,
  pageRecord?: ApifyPageRecord
): Promise<FacebookPageStats> {
  const pageId = livePageId(searchQuery);

  try {
    const feedPosts = await scrapeFacebookPagePosts(
      pageUrl,
      apiKey,
      POSTS_FETCH_LIMIT
    );

    console.log("[Apify] facebook-posts-scraper returned", feedPosts.length, "posts for", pageUrl);

    if (feedPosts.length > 0) {
      const estimates = calculateEstimatedViewsFromFeedPosts(feedPosts);
      const popularPosts = mapFeedPostsToPopularPosts(feedPosts, pageId);

      console.log("[Apify] popular_posts from posts scraper:", {
        count: popularPosts.length,
        sample: popularPosts.slice(0, 2).map((p) => ({
          title: p.title.slice(0, 60),
          thumbnailUrl: p.thumbnailUrl,
          postUrl: p.postUrl,
        })),
      });

      return {
        ...stats,
        popularPosts,
        ...estimates,
      };
    }
  } catch (err) {
    console.warn(
      "[attachPopularPosts] facebook-posts-scraper failed:",
      err instanceof Error ? err.message : err
    );
  }

  if (pageRecord) {
    const fromPage = popularPostsFromApifyPageRecord(pageRecord, searchQuery);
    if (fromPage?.length) {
      console.log("[Apify] popular_posts fallback from page record:", {
        count: fromPage.length,
        sample: fromPage.slice(0, 2).map((p) => ({
          title: p.title.slice(0, 60),
          postUrl: p.postUrl,
        })),
      });
      return { ...stats, popularPosts: fromPage };
    }
  }

  return stats;
}

async function scrapeWithApify(
  pageUrl: string,
  apiKey: string,
  searchQuery: string
): Promise<FacebookPageStats | null> {
  const runId = await startApifyRun(pageUrl, apiKey);
  if (!runId) return null;

  const datasetId = await waitForApifyRun(runId, apiKey);
  if (!datasetId) return null;

  const items = await fetchDatasetItems(datasetId, apiKey);
  if (items.length === 0) return null;

  const record = items[0];
  const pageLabel =
    record.title?.trim() || record.pageName?.trim() || pageUrl;

  logApifyProfileAndPostsFields(record, pageLabel);

  const stats = buildStatsFromApifyRecord(record, pageUrl);
  if (!stats) return null;

  const enriched = await attachPopularPosts(
    stats,
    pageUrl,
    searchQuery,
    apiKey,
    record
  );
  const category = extractCategoryFromApifyRecord(
    record,
    enriched.pageName
  );

  console.log("[scrapeWithApify] saving to pages_database:", {
    pageName: enriched.pageName,
    profilePictureUrl: enriched.profilePictureUrl ?? null,
    popularPostsCount: enriched.popularPosts?.length ?? 0,
    category,
  });

  const persisted = await persistScrapedPageToDatabase(
    searchQuery,
    enriched,
    category
  );
  if (!persisted.ok && persisted.error) {
    console.warn(
      "[scrapeFacebookPageLight] pages_database upsert:",
      persisted.error
    );
  }

  return enriched;
}

/**
 * Production scraper using Apify Facebook Pages Scraper.
 * Falls back to mock data if Apify fails or is unconfigured.
 */
export async function scrapeFacebookPageLight(
  query: string
): Promise<FacebookPageStats> {
  console.log("[scrapeFacebookPageLight] reached", { query });
  const apiKeyPreview = process.env.APIFY_API_KEY?.trim().slice(0, 10);
  console.log(
    "[scrapeFacebookPageLight] APIFY_API_KEY prefix:",
    apiKeyPreview ?? "(not set)"
  );

  const { urls, fallbackName } = resolveFacebookPageUrls(query);
  const apiKey = process.env.APIFY_API_KEY?.trim();

  if (apiKey) {
    for (const url of urls) {
      try {
        const stats = await scrapeWithApify(url, apiKey, query);
        if (stats) return stats;
      } catch {
        // try next URL or fall back to mock
      }
    }
  }

  const fallback = buildPageStats(
    fallbackName,
    `Sample analytics for ${fallbackName}. Live Facebook data is estimated while scraping is unavailable.`,
    estimateFollowersFromName(fallbackName)
  );

  const persisted = await persistScrapedPageToDatabase(query, fallback);
  if (!persisted.ok && persisted.error) {
    console.warn(
      "[scrapeFacebookPageLight] pages_database upsert (fallback):",
      persisted.error
    );
  }

  return fallback;
}
