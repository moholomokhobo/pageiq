import { fetchFreshCachedPage, pageDatabaseRowToFacebookPageStats } from "@/lib/pages-database-cache";
import {
  cachedRowHasProfilePicture,
  normalizePageDatabaseRow,
} from "@/lib/pages-database";
import { persistScrapedPageToDatabase } from "@/lib/persist-scraped-page";
import { facebookPageStatsToSearchResponse } from "@/lib/search-api-response";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

async function scrapeFresh(trimmed: string) {
  const useLightScraper = Boolean(process.env.APIFY_API_KEY?.trim());
  console.log(
    "Scraper selected:",
    useLightScraper ? "light (Apify)" : "Playwright"
  );

  const data = useLightScraper
    ? await (
        await import("@/lib/facebook-scraper-light")
      ).scrapeFacebookPageLight(trimmed)
    : await (
        await import("@/lib/facebook-scraper")
      ).scrapeFacebookPage(trimmed);

  if (!useLightScraper) {
    const persisted = await persistScrapedPageToDatabase(trimmed, data);
    if (!persisted.ok && persisted.error) {
      console.warn("[search] pages_database upsert:", persisted.error);
    }
  }

  return facebookPageStatsToSearchResponse(data, false);
}

export async function GET(request: Request) {
  console.log(
    "API KEY EXISTS:",
    Boolean(process.env.APIFY_API_KEY?.trim())
  );

  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get("q") ?? searchParams.get("page");

  if (!pageName?.trim()) {
    return NextResponse.json(
      { error: "Missing page name. Use ?q=PageName" },
      { status: 400 }
    );
  }

  try {
    const trimmed = pageName.trim();
    const cachedRow = await fetchFreshCachedPage(trimmed);

    if (cachedRow) {
      console.log("Cache hit — evaluating saved data");
      console.log(
        "[search] Cache hit — raw pages_database record:",
        JSON.stringify(cachedRow, null, 2)
      );

      const normalizedRow = normalizePageDatabaseRow(cachedRow);

      if (!cachedRowHasProfilePicture(normalizedRow)) {
        console.log(
          "[search] Cache incomplete — profile_picture_url is null; forcing fresh Apify scrape"
        );
        console.log("Cache miss — calling Apify");
        return NextResponse.json(await scrapeFresh(trimmed));
      }

      console.log(
        "[search] Cache hit — normalized record (after JSON parse):",
        JSON.stringify(normalizedRow, null, 2)
      );
      console.log("[search] Cache hit — field types:", {
        profile_picture_url: typeof normalizedRow.profile_picture_url,
        avg_engagement_text: typeof normalizedRow.avg_engagement_text,
        popular_posts: Array.isArray(normalizedRow.popular_posts)
          ? `array[${normalizedRow.popular_posts.length}]`
          : typeof normalizedRow.popular_posts,
        outlier_posts: Array.isArray(normalizedRow.outlier_posts)
          ? `array[${normalizedRow.outlier_posts.length}]`
          : typeof normalizedRow.outlier_posts,
        monetization: normalizedRow.monetization
          ? typeof normalizedRow.monetization
          : "null",
      });

      const stats = pageDatabaseRowToFacebookPageStats(normalizedRow);
      const response = facebookPageStatsToSearchResponse(stats, true);

      console.log(
        "[search] Cache hit — API response payload (camelCase, matches live scrape):",
        JSON.stringify(response, null, 2)
      );

      return NextResponse.json(response);
    }

    console.log("Cache miss — calling Apify");
    return NextResponse.json(await scrapeFresh(trimmed));
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Facebook page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
