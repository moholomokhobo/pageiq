import { createClient } from "@/lib/supabase/server";
import { logSupabaseError, pagesDatabaseTable } from "@/lib/supabase/tables";
import {
  buildOverviewFromPages,
  type OverviewDashboardData,
} from "@/lib/overview-from-database";
import {
  MIN_PAGES_FOR_DB_OVERVIEW_SECTIONS,
  type PageDatabaseRow,
} from "@/lib/pages-database";
import {
  highCompetitionPages,
  nicheSaturationItems,
  opportunityRadarItems,
  OVERVIEW_STATS,
  popularCategories,
  recentOutlierPages,
  risingStarPages,
  trendingHashtags,
  trendingTopics,
} from "@/lib/overview-data";

function mockOverviewData(): OverviewDashboardData {
  return {
    totalPagesAnalyzed: OVERVIEW_STATS.totalPagesAnalyzed,
    addedToday: OVERVIEW_STATS.addedToday,
    recentOutlierPages,
    highCompetitionPages,
    trendingTopics,
    trendingHashtags,
    popularCategories,
    opportunityRadarItems,
    nicheSaturationItems,
    risingStarPages,
  };
}

export async function fetchAllPagesFromDatabase(): Promise<PageDatabaseRow[]> {
  const supabase = await createClient();
  const { data, error } = await pagesDatabaseTable(supabase)
    .select("*")
    .order("last_scraped_at", { ascending: false });

  if (error) {
    logSupabaseError("fetchAllPagesFromDatabase", error);
    return [];
  }

  return (data ?? []) as PageDatabaseRow[];
}

export async function fetchOverviewDashboardData(): Promise<OverviewDashboardData> {
  const rows = await fetchAllPagesFromDatabase();
  const mock = mockOverviewData();

  if (rows.length < MIN_PAGES_FOR_DB_OVERVIEW_SECTIONS) {
    return mock;
  }

  const fromDb = buildOverviewFromPages(rows);
  return {
    ...fromDb,
    recentOutlierPages:
      fromDb.recentOutlierPages.length > 0
        ? fromDb.recentOutlierPages
        : mock.recentOutlierPages,
    highCompetitionPages:
      fromDb.highCompetitionPages.length > 0
        ? fromDb.highCompetitionPages
        : mock.highCompetitionPages,
    risingStarPages:
      fromDb.risingStarPages.length > 0
        ? fromDb.risingStarPages
        : mock.risingStarPages,
  };
}

export async function countPagesInDatabase(): Promise<number> {
  const supabase = await createClient();
  const { count, error } = await pagesDatabaseTable(supabase).select("*", {
    count: "exact",
    head: true,
  });

  if (error) {
    logSupabaseError("countPagesInDatabase", error);
    return 0;
  }
  return count ?? 0;
}
