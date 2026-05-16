import type {
  HighCompetitionRow,
  NicheSaturationItem,
  OpportunityRadarItem,
  OverviewTimePeriod,
  PopularCategory,
  RecentOutlierRow,
  RisingStarItem,
  TrendingHashtag,
  TrendingTopic,
} from "@/lib/overview-data";
import type { PageDatabaseRow } from "@/lib/pages-database";
import { periodToSinceDate } from "@/lib/pages-database";

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff&size=128&bold=true`;
}

function formatViews(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(Math.round(n));
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toLocaleString("en-US");
}

function filterByPeriod(
  rows: PageDatabaseRow[],
  period: OverviewTimePeriod
): PageDatabaseRow[] {
  const since = periodToSinceDate(period);
  if (!since) return rows;
  return rows.filter((row) => new Date(row.last_scraped_at) >= since);
}

function outlierMultiplier(score: number): number {
  return Number((3.5 + (score / 100) * 4.5).toFixed(2));
}

function sortByRecent(rows: PageDatabaseRow[]) {
  return [...rows].sort(
    (a, b) =>
      new Date(b.last_scraped_at).getTime() -
      new Date(a.last_scraped_at).getTime()
  );
}

export type OverviewDashboardData = {
  totalPagesAnalyzed: number;
  addedToday: number;
  recentOutlierPages: RecentOutlierRow[];
  highCompetitionPages: HighCompetitionRow[];
  trendingTopics: TrendingTopic[];
  trendingHashtags: TrendingHashtag[];
  popularCategories: PopularCategory[];
  opportunityRadarItems: OpportunityRadarItem[];
  nicheSaturationItems: NicheSaturationItem[];
  risingStarPages: RisingStarItem[];
};

function mapOutliers(rows: PageDatabaseRow[]) {
  return sortByRecent(rows)
    .filter((row) => row.is_outlier)
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      pageName: row.page_name,
      followerCount: formatFollowers(row.followers),
      multiplier: outlierMultiplier(row.outlier_score),
      profilePictureUrl: avatar(row.page_name),
      searchQuery: row.page_url,
    }));
}

function mapCompetition(rows: PageDatabaseRow[]) {
  return sortByRecent(rows)
    .sort(
      (a, b) =>
        b.followers * 0.3 +
        b.avg_views_reel * 0.4 +
        b.outlier_score * 1000 -
        (a.followers * 0.3 + a.avg_views_reel * 0.4 + a.outlier_score * 1000)
    )
    .slice(0, 12)
    .map((row) => ({
      id: row.id,
      pageName: row.page_name,
      niche: row.category,
      followerCount: formatFollowers(row.followers),
      avgViews: formatViews(row.avg_views_reel),
      uploadsCount: row.total_posts,
      outlierScore: row.outlier_score,
      profilePictureUrl: avatar(row.page_name),
      searchQuery: row.page_url,
    }));
}

function mapTrendingTopics(rows: PageDatabaseRow[]) {
  const byCategory = new Map<
    string,
    { count: number; views: number; outlier: number }
  >();

  for (const row of rows) {
    const current = byCategory.get(row.category) ?? {
      count: 0,
      views: 0,
      outlier: 0,
    };
    byCategory.set(row.category, {
      count: current.count + 1,
      views: current.views + row.avg_views_reel,
      outlier: current.outlier + row.outlier_score,
    });
  }

  return [...byCategory.entries()]
    .map(([topic, stats], index) => ({
      id: `tt-db-${index}`,
      topic,
      engagementLift: Math.round(
        Math.min(180, 40 + stats.outlier / Math.max(1, stats.count))
      ),
      postVolume: `${formatViews(stats.views)} avg views`,
    }))
    .sort((a, b) => b.engagementLift - a.engagementLift)
    .slice(0, 6);
}

function mapTrendingHashtags(rows: PageDatabaseRow[]) {
  const tags = [
    "#reels",
    "#facebookmarketing",
    "#smallbusiness",
    "#viral",
    "#motivation",
    "#recipe",
  ];

  return tags.map((tag, index) => {
    const slice = rows.filter((_, i) => i % tags.length === index);
    const avgOutlier =
      slice.reduce((sum, row) => sum + row.outlier_score, 0) /
      Math.max(1, slice.length);
    const posts = slice.reduce((sum, row) => sum + row.total_posts, 0);

    return {
      id: `th-db-${index}`,
      tag,
      postCount: `${formatViews(posts * 120)} posts`,
      increasePercent: Math.round(30 + avgOutlier * 0.55),
      momentum: Math.min(98, Math.round(45 + avgOutlier * 0.5)),
    };
  });
}

function mapPopularCategories(rows: PageDatabaseRow[]) {
  const byCategory = new Map<
    string,
    { count: number; views: number; outlier: number }
  >();

  for (const row of rows) {
    const current = byCategory.get(row.category) ?? {
      count: 0,
      views: 0,
      outlier: 0,
    };
    byCategory.set(row.category, {
      count: current.count + 1,
      views: current.views + row.avg_views_reel,
      outlier: current.outlier + row.outlier_score,
    });
  }

  const total = rows.length || 1;

  return [...byCategory.entries()]
    .map(([name, stats], index) => ({
      id: `cat-db-${index}`,
      name,
      pageCount: stats.count,
      sharePercent: Math.round((stats.count / total) * 100),
      engagementLift: Math.round(stats.outlier / Math.max(1, stats.count)),
    }))
    .sort((a, b) => b.pageCount - a.pageCount);
}

function mapOpportunityRadar(rows: PageDatabaseRow[]) {
  const byCategory = mapPopularCategories(rows);

  return byCategory
    .filter((cat) => cat.engagementLift >= 50)
    .map((cat, index) => ({
      id: `or-db-${index}`,
      label: `${cat.name} content gap`,
      score: Math.min(98, 70 + cat.engagementLift),
      signal:
        cat.sharePercent < 12
          ? "Low saturation"
          : cat.engagementLift >= 70
            ? "High CPM niche"
            : "Rising demand",
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

function saturationLabel(percent: number): string {
  if (percent >= 85) return "Saturated";
  if (percent >= 65) return "High";
  if (percent >= 45) return "Moderate";
  return "Open";
}

function mapNicheSaturation(rows: PageDatabaseRow[]) {
  const byCategory = mapPopularCategories(rows);
  const maxCount = Math.max(...byCategory.map((c) => c.pageCount), 1);

  return byCategory
    .map((cat, index) => {
      const saturationPercent = Math.round((cat.pageCount / maxCount) * 100);
      return {
        id: `ns-db-${index}`,
        niche: cat.name,
        saturationPercent,
        label: saturationLabel(saturationPercent),
      };
    })
    .sort((a, b) => b.saturationPercent - a.saturationPercent)
    .slice(0, 6);
}

function mapRisingStars(rows: PageDatabaseRow[]) {
  return sortByRecent(rows)
    .filter((row) => row.is_rising_star)
    .slice(0, 8)
    .map((row) => ({
      id: row.id,
      pageName: row.page_name,
      growthPercent: Math.round(outlierMultiplier(row.outlier_score) * 100),
      followerCount: formatFollowers(row.followers),
      profilePictureUrl: avatar(row.page_name),
      searchQuery: row.page_url,
    }));
}

export function buildOverviewFromPages(
  allRows: PageDatabaseRow[],
  periods: Partial<Record<string, OverviewTimePeriod>> = {}
): OverviewDashboardData {
  const defaultPeriod: OverviewTimePeriod = "Last 30 Days";
  const p = (key: string) => periods[key] ?? defaultPeriod;

  const outlierRows = filterByPeriod(allRows, p("outliers"));
  const competitionRows = filterByPeriod(allRows, p("competition"));
  const topicRows = filterByPeriod(allRows, p("topics"));
  const hashtagRows = filterByPeriod(allRows, p("hashtags"));
  const categoryRows = filterByPeriod(allRows, p("categories"));
  const opportunityRows = filterByPeriod(allRows, p("opportunity"));
  const saturationRows = filterByPeriod(allRows, p("saturation"));
  const risingRows = filterByPeriod(allRows, p("rising"));

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const addedToday = allRows.filter(
    (row) => new Date(row.last_scraped_at) >= todayStart
  ).length;

  return {
    totalPagesAnalyzed: allRows.length,
    addedToday: addedToday || allRows.length,
    recentOutlierPages: mapOutliers(outlierRows),
    highCompetitionPages: mapCompetition(competitionRows),
    trendingTopics: mapTrendingTopics(topicRows.length ? topicRows : allRows),
    trendingHashtags: mapTrendingHashtags(
      hashtagRows.length ? hashtagRows : allRows
    ),
    popularCategories: mapPopularCategories(
      categoryRows.length ? categoryRows : allRows
    ),
    opportunityRadarItems: mapOpportunityRadar(
      opportunityRows.length ? opportunityRows : allRows
    ),
    nicheSaturationItems: mapNicheSaturation(
      saturationRows.length ? saturationRows : allRows
    ),
    risingStarPages: mapRisingStars(risingRows),
  };
}
