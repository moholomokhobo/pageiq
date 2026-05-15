import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import {
  buildPageStats,
  buildPageStatsFromPosts,
  calculateEngagementRate,
  calculatePiqScore,
  estimateFollowersFromName,
  generateMockPosts,
  parseCountToken,
  type FacebookPageStats,
  type PostType,
  type ScrapedPost,
} from "@/lib/facebook-scraper-core";

const APIFY_ACTOR = "apify~facebook-pages-scraper";
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
  about_me?: { text?: string };
  followers?: number;
  likes?: number;
  categories?: string[];
  info?: string[];
  profilePictureUrl?: string;
  profilePhoto?: string;
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

function extractProfilePictureUrl(record: ApifyPageRecord): string | undefined {
  const direct = record.profilePictureUrl?.trim();
  if (direct?.startsWith("http")) return direct;
  return undefined;
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
  const stats = buildPageStatsFromPosts(
    pageName,
    about,
    resolvedFollowers,
    posts,
    samplePostsAnalysis,
    profilePictureUrl
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
      engagementRate: `${engagementRate}%`,
      piqScore: calculatePiqScore(
        resolvedFollowers,
        engagementRate,
        stats.postsLast30Days
      ),
    };
  }

  return stats;
}

async function scrapeWithApify(
  pageUrl: string,
  apiKey: string
): Promise<FacebookPageStats | null> {
  const runId = await startApifyRun(pageUrl, apiKey);
  if (!runId) return null;

  const datasetId = await waitForApifyRun(runId, apiKey);
  if (!datasetId) return null;

  const items = await fetchDatasetItems(datasetId, apiKey);
  if (items.length === 0) return null;

  return buildStatsFromApifyRecord(items[0], pageUrl);
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
        const stats = await scrapeWithApify(url, apiKey);
        if (stats) return stats;
      } catch {
        // try next URL or fall back to mock
      }
    }
  }

  return buildPageStats(
    fallbackName,
    `Sample analytics for ${fallbackName}. Live Facebook data is estimated while scraping is unavailable.`,
    estimateFollowersFromName(fallbackName)
  );
}
