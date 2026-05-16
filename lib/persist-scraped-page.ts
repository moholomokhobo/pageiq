import type { FacebookPageStats } from "@/lib/facebook-scraper-core";
import { mapScrapeToPageInsert } from "@/lib/pages-database";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logSupabaseError, pagesDatabaseTable } from "@/lib/supabase/tables";

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
  stats: FacebookPageStats,
  category?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!stats.pageName?.trim()) {
    return { ok: false, error: "Missing page name" };
  }

  try {
    const supabase = await getWriteClient();
    const row = mapScrapeToPageInsert(searchQuery, stats, category);
    const now = new Date().toISOString();

    console.log("[persistScrapedPageToDatabase] upsert payload:", {
      page_url: row.page_url,
      page_name: row.page_name,
      profile_picture_url: row.profile_picture_url,
      popular_posts_count: Array.isArray(row.popular_posts)
        ? row.popular_posts.length
        : 0,
      profilePictureUrl_from_stats: stats.profilePictureUrl ?? null,
      popularPosts_from_stats: stats.popularPosts?.length ?? 0,
    });

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
