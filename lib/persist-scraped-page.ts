import type { FacebookPageStats } from "@/lib/facebook-scraper-core";
import { mapScrapeToPageInsert } from "@/lib/pages-database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, pagesDatabaseTable } from "@/lib/supabase/tables";

export function isLiveApifyScrapeResult(stats: FacebookPageStats): boolean {
  return !stats.samplePostsAnalysis && Boolean(stats.pageName?.trim());
}

async function getWriteClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return createAdminClient();
  }
  return createClient();
}

/**
 * Upserts a successfully scraped page into pages_database (by page_url).
 */
export async function persistScrapedPageToDatabase(
  searchQuery: string,
  stats: FacebookPageStats
): Promise<{ ok: boolean; error?: string }> {
  if (!isLiveApifyScrapeResult(stats)) {
    return { ok: false, error: "Not a live scrape result" };
  }

  try {
    const supabase = await getWriteClient();
    const row = mapScrapeToPageInsert(searchQuery, stats);
    const now = new Date().toISOString();

    const { error } = await pagesDatabaseTable(supabase).upsert(
      {
        ...row,
        last_scraped_at: now,
        updated_at: now,
      },
      { onConflict: "page_url" }
    );

    if (error) {
      logSupabaseError("persistScrapedPageToDatabase", error);
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Persist failed";
    console.error("[persistScrapedPageToDatabase]", message);
    return { ok: false, error: message };
  }
}
