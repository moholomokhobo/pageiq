import { resolveFacebookPageUrls } from "@/lib/facebook-page-url";
import {
  buildPageStats,
  extractAbout,
  extractFollowerCount,
  type FacebookPageStats,
} from "@/lib/facebook-scraper-core";
import { chromium, type Page } from "playwright";

export type {
  FacebookPageStats,
  OutlierPostResult,
  PostType,
  ScrapedPost,
} from "@/lib/facebook-scraper-core";

export {
  calculateEngagementRate,
  calculateOutlierScore,
  findOutlierPosts,
  generateMockPosts,
} from "@/lib/facebook-scraper-core";

async function dismissCookieBanner(page: Page) {
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
  const { urls, fallbackName } = resolveFacebookPageUrls(query);

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

    let bodyText = "";
    let metaTitle = "";
    let metaDescription = "";

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
          .catch(() => null)) ?? "";
      metaDescription =
        (await page
          .locator('meta[property="og:description"]')
          .getAttribute("content")
          .catch(() => null)) ?? "";

      const followers = extractFollowerCount(bodyText);
      if (followers > 0 || metaTitle) {
        break;
      }
    }

    const followers = extractFollowerCount(bodyText);
    if (followers === 0 && !bodyText.toLowerCase().includes("facebook")) {
      throw new Error(
        "Could not load Facebook page data. The page may be private or blocked."
      );
    }

    const pageName =
      metaTitle
        .replace(/\s*\|\s*Facebook.*$/i, "")
        .replace(/\s*-\s*Home$/i, "")
        .trim() || fallbackName;

    const about = extractAbout(bodyText, metaDescription);

    return buildPageStats(
      pageName,
      about,
      followers > 0 ? followers : 1
    );
  } finally {
    await browser.close();
  }
}
