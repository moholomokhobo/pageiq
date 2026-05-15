import { chromium } from "playwright";

export type FacebookPageStats = {
  pageName: string;
  followerCount: string;
  engagementRate: string;
  recentPostsCount: number;
  piqScore: number;
};

function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-US");
}

function parseCountToken(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  const suffix = (match[2] ?? "").toUpperCase();
  if (suffix === "K") num *= 1_000;
  if (suffix === "M") num *= 1_000_000;
  if (suffix === "B") num *= 1_000_000_000;

  return Math.round(num);
}

function extractFollowerCount(text: string): number {
  const patterns = [
    /([\d,.]+[KMB]?)\s+followers/i,
    /([\d,.]+[KMB]?)\s+likes/i,
    /([\d,.]+[KMB]?)\s+people like this/i,
    /([\d,.]+[KMB]?)\s+follow this/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = parseCountToken(match[1]);
      if (parsed > 0) return parsed;
    }
  }

  return 0;
}

function extractInteractionSignals(text: string): number[] {
  const matches = text.match(/([\d,.]+[KMB]?)\s+(likes|comments|shares|reactions)/gi) ?? [];
  return matches
    .map((entry) => {
      const token = entry.match(/^([\d,.]+[KMB]?)/i)?.[1];
      return token ? parseCountToken(token) : 0;
    })
    .filter((n) => n > 0);
}

function calculateEngagementRate(
  followers: number,
  interactions: number[],
  recentPostsCount: number
): number {
  if (followers > 0 && interactions.length > 0) {
    const avgInteractions =
      interactions.reduce((sum, n) => sum + n, 0) / interactions.length;
    const rate = (avgInteractions / followers) * 100;
    return Math.min(15, Math.max(0.1, Number(rate.toFixed(1))));
  }

  const baseline = 1.2 + Math.log10(Math.max(followers, 1_000)) * 0.45;
  const activityBoost = Math.min(2.5, recentPostsCount * 0.15);
  return Number(Math.min(12, baseline + activityBoost).toFixed(1));
}

export function calculatePiqScore(
  followers: number,
  engagementRate: number,
  recentPostsCount: number
): number {
  const reachScore = Math.min(35, Math.log10(Math.max(followers, 100)) * 8);
  const engagementScore = Math.min(40, engagementRate * 5.5);
  const activityScore = Math.min(25, recentPostsCount * 2);
  return Math.round(
    Math.min(100, Math.max(0, reachScore + engagementScore + activityScore))
  );
}

function slugifyPageName(query: string): string {
  return query
    .trim()
    .replace(/^@/, "")
    .replace(/\s+/g, "")
    .toLowerCase();
}

function titleCase(query: string): string {
  return query
    .trim()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

async function dismissCookieBanner(page: import("playwright").Page) {
  const labels = [
    "Allow all cookies",
    "Accept All",
    "Allow essential and optional cookies",
  ];

  for (const label of labels) {
    const button = page.getByRole("button", { name: label });
    if (await button.isVisible().catch(() => false)) {
      await button.click().catch(() => undefined);
      break;
    }
  }
}

export async function scrapeFacebookPage(
  query: string
): Promise<FacebookPageStats> {
  const slug = slugifyPageName(query);
  if (!slug) {
    throw new Error("Please enter a valid Facebook page name.");
  }

  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      locale: "en-US",
      viewport: { width: 1280, height: 900 },
    });

    const page = await context.newPage();
    const urls = [
      `https://www.facebook.com/${slug}`,
      `https://m.facebook.com/${slug}`,
    ];

    let bodyText = "";
    let metaTitle = "";
    let recentPostsCount = 0;

    for (const url of urls) {
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: 45_000,
      });

      await dismissCookieBanner(page);
      await page.waitForTimeout(2_500);

      bodyText = await page.locator("body").innerText();
      metaTitle =
        (await page
          .locator('meta[property="og:title"]')
          .getAttribute("content")
          .catch(() => null)) ??
        "";

      recentPostsCount = await page.locator('[role="article"]').count();

      const followers = extractFollowerCount(bodyText);
      if (followers > 0 || recentPostsCount > 0) {
        break;
      }
    }

    const followers = extractFollowerCount(bodyText);
    if (followers === 0 && !bodyText.toLowerCase().includes("facebook")) {
      throw new Error(
        "Could not load Facebook page data. The page may be private or blocked."
      );
    }

    const interactions = extractInteractionSignals(bodyText);
    const engagementRate = calculateEngagementRate(
      followers,
      interactions,
      recentPostsCount
    );

    const pageName =
      metaTitle
        .replace(/\s*\|\s*Facebook.*$/i, "")
        .replace(/\s*-\s*Home$/i, "")
        .trim() || titleCase(query);

    const piqScore = calculatePiqScore(
      followers,
      engagementRate,
      recentPostsCount
    );

    return {
      pageName,
      followerCount: followers > 0 ? formatCount(followers) : "N/A",
      engagementRate: `${engagementRate}%`,
      recentPostsCount,
      piqScore,
    };
  } finally {
    await browser.close();
  }
}
