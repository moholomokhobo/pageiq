import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import {
  buildPageStats,
  estimateFollowersFromName,
  extractAbout,
  extractFollowerCount,
  type FacebookPageStats,
} from "@/lib/facebook-scraper-core";
import * as cheerio from "cheerio";

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Cache-Control": "no-cache",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
};

type ParsedPageMeta = {
  pageName: string;
  description: string;
  category: string;
  followers: number;
};

function cleanPageTitle(raw: string): string {
  return raw
    .replace(/\s*\|\s*Facebook.*$/i, "")
    .replace(/\s*-\s*Home$/i, "")
    .replace(/\s*·\s*Facebook.*$/i, "")
    .trim();
}

function extractCategoryFromTitle(title: string): string {
  const parts = title.split("·").map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const last = parts[parts.length - 1];
    if (!/facebook/i.test(last)) return last;
    if (parts.length >= 3) return parts[parts.length - 2];
  }
  return "";
}

function extractCategoryFromHtml(html: string, $: cheerio.CheerioAPI): string {
  const ogTitle = $("meta[property='og:title']").attr("content") ?? "";
  const fromTitle = extractCategoryFromTitle(ogTitle);
  if (fromTitle) return fromTitle;

  const categoryMeta =
    $("meta[property='og:site_name']").attr("content") ??
    $("meta[name='page-type']").attr("content") ??
    "";

  if (categoryMeta && !/facebook/i.test(categoryMeta)) {
    return categoryMeta;
  }

  const jsonLdMatches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );

  for (const match of jsonLdMatches) {
    try {
      const data = JSON.parse(match[1]) as Record<string, unknown>;
      const category =
        (typeof data.category === "string" && data.category) ||
        (typeof data.genre === "string" && data.genre) ||
        "";
      if (category) return category;
    } catch {
      // ignore invalid JSON-LD blocks
    }
  }

  const inlineCategory = html.match(
    /"category(?:_name)?"\s*:\s*"([^"]{2,80})"/i
  );
  if (inlineCategory?.[1]) {
    return inlineCategory[1].replace(/\\u0020/g, " ");
  }

  return "";
}

function parseHtmlMeta(html: string, fallbackName: string): ParsedPageMeta {
  const $ = cheerio.load(html);
  const ogTitle = $("meta[property='og:title']").attr("content") ?? "";
  const titleTag = $("title").text().trim();
  const metaDescription =
    $("meta[property='og:description']").attr("content") ??
    $("meta[name='description']").attr("content") ??
    "";

  const pageName =
    cleanPageTitle(ogTitle) ||
    cleanPageTitle(titleTag) ||
    fallbackName;

  const bodyText = $("body").text().replace(/\s+/g, " ");
  const followers = extractFollowerCount(`${html}\n${bodyText}`);
  const description = extractAbout(bodyText, metaDescription);
  const category = extractCategoryFromHtml(html, $);

  return { pageName, description, category, followers };
}

function composeAbout(description: string, category: string): string {
  const parts: string[] = [];
  if (description.trim()) parts.push(description.trim());
  if (category.trim()) parts.push(`Category: ${category.trim()}`);
  return parts.join(" · ");
}

function isBlockedResponse(
  status: number,
  html: string,
  finalUrl: string
): boolean {
  if (status === 0 || status >= 400) return true;

  const lower = html.toLowerCase();
  const urlLower = finalUrl.toLowerCase();

  if (
    urlLower.includes("/login") ||
    urlLower.includes("checkpoint") ||
    urlLower.includes("consent")
  ) {
    return true;
  }

  if (
    lower.includes("you must log in") ||
    lower.includes("log in to facebook") ||
    lower.includes("login to continue")
  ) {
    return true;
  }

  if (html.length < 4_000 && lower.includes("login")) {
    return true;
  }

  return false;
}

async function fetchPageHtml(url: string): Promise<{
  html: string;
  status: number;
  finalUrl: string;
} | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);

  try {
    const response = await fetch(url, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });

    const html = await response.text();
    return {
      html,
      status: response.status,
      finalUrl: response.url,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function buildMockStats(pageName: string, categoryHint = ""): FacebookPageStats {
  const followers = estimateFollowersFromName(pageName);
  const nicheCategory = categoryHint || "Public figure";
  const about = composeAbout(
    `Sample analytics for ${pageName}. Facebook data is estimated while live scraping is unavailable.`,
    nicheCategory
  );

  return buildPageStats(pageName, about, followers);
}

/**
 * Lightweight Facebook page scraper for serverless (fetch + cheerio).
 * Never throws — falls back to realistic mock data when blocked.
 */
export async function scrapeFacebookPageLight(
  query: string
): Promise<FacebookPageStats> {
  const { urls, fallbackName } = resolveFacebookPageUrls(query);

  let best: ParsedPageMeta | null = null;

  for (const url of urls) {
    const fetched = await fetchPageHtml(url);
    if (!fetched) continue;

    const { html, status, finalUrl } = fetched;
    if (isBlockedResponse(status, html, finalUrl)) continue;

    const parsed = parseHtmlMeta(html, fallbackName);
    const hasSignal =
      parsed.followers > 0 ||
      parsed.description.length > 0 ||
      parsed.category.length > 0 ||
      parsed.pageName.length > 0;

    if (!hasSignal) continue;

    if (!best || parsed.followers > best.followers) {
      best = parsed;
    }

    if (parsed.followers > 0 && parsed.description) {
      break;
    }
  }

  if (!best) {
    return buildMockStats(fallbackName);
  }

  const followers =
    best.followers > 0 ? best.followers : estimateFollowersFromName(best.pageName);

  const about =
    composeAbout(best.description, best.category) ||
    `Public Facebook page · ${best.pageName}`;

  return buildPageStats(best.pageName, about, followers);
}
