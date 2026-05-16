"use client";

import { AppTopActions } from "@/components/app-top-actions";
import { FacebookSearchTip } from "@/components/facebook-search-tip";
import { FACEBOOK_PAGE_SEARCH_PLACEHOLDER } from "@/lib/facebook-search-copy";
import { SectionTimePeriodSelect } from "@/components/section-time-period-select";
import {
  filterOverviewRows,
  highCompetitionPages,
  nicheSaturationItems,
  opportunityRadarItems,
  OVERVIEW_STATS,
  OVERVIEW_TIME_PERIODS,
  popularCategories,
  recentOutlierPages,
  risingStarPages,
  trendingHashtags,
  trendingTopics,
  type OverviewTimePeriod,
} from "@/lib/overview-data";
import { buildOverviewFromPages } from "@/lib/overview-from-database";
import {
  MIN_PAGES_FOR_DB_OVERVIEW_SECTIONS,
  type PageDatabaseRow,
} from "@/lib/pages-database";
import Link from "next/link";
import { useMemo, useState } from "react";

type OverviewClientProps = {
  sourceRows?: PageDatabaseRow[];
};

const DEFAULT_PERIOD: OverviewTimePeriod = OVERVIEW_TIME_PERIODS[0];

function SectionTitleRow({
  title,
  period,
  onPeriodChange,
  selectId,
}: {
  title: string;
  period: OverviewTimePeriod;
  onPeriodChange: (value: OverviewTimePeriod) => void;
  selectId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h2>
      <SectionTimePeriodSelect
        id={selectId}
        value={period}
        onChange={onPeriodChange}
      />
    </div>
  );
}

const panelClass =
  "rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

const viewAllClass =
  "shrink-0 text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300";

function formatTotal(n: number) {
  return n.toString();
}

function multiplierBarWidth(multiplier: number) {
  const max = 8;
  return `${Math.min(100, (multiplier / max) * 100)}%`;
}

function fillToCount<T extends { id: string }>(filtered: T[], source: T[], count: number) {
  if (filtered.length >= count) return filtered.slice(0, count);
  const seen = new Set(filtered.map((row) => row.id));
  const rest = source.filter((row) => !seen.has(row.id));
  return [...filtered, ...rest].slice(0, count);
}

export function OverviewClient({ sourceRows = [] }: OverviewClientProps) {
  const useDatabase =
    sourceRows.length >= MIN_PAGES_FOR_DB_OVERVIEW_SECTIONS;
  const [keyword, setKeyword] = useState("");
  const [outliersPeriod, setOutliersPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [competitionPeriod, setCompetitionPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [topicsPeriod, setTopicsPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [hashtagsPeriod, setHashtagsPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [categoriesPeriod, setCategoriesPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [opportunityPeriod, setOpportunityPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [saturationPeriod, setSaturationPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);
  const [risingStarsPeriod, setRisingStarsPeriod] =
    useState<OverviewTimePeriod>(DEFAULT_PERIOD);

  const dashboard = useMemo(() => {
    const mock = {
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

    if (!useDatabase) return mock;

    const fromDb = buildOverviewFromPages(sourceRows, {
      outliers: outliersPeriod,
      competition: competitionPeriod,
      topics: topicsPeriod,
      hashtags: hashtagsPeriod,
      categories: categoriesPeriod,
      opportunity: opportunityPeriod,
      saturation: saturationPeriod,
      rising: risingStarsPeriod,
    });

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
  }, [
    useDatabase,
    sourceRows,
    outliersPeriod,
    competitionPeriod,
    topicsPeriod,
    hashtagsPeriod,
    categoriesPeriod,
    opportunityPeriod,
    saturationPeriod,
    risingStarsPeriod,
  ]);

  const displayOutliers = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.recentOutlierPages, keyword, ["pageName"]),
        dashboard.recentOutlierPages,
        4
      ),
    [dashboard.recentOutlierPages, keyword]
  );

  const displayCompetition = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.highCompetitionPages, keyword, [
          "pageName",
          "niche",
        ]),
        dashboard.highCompetitionPages,
        4
      ),
    [dashboard.highCompetitionPages, keyword]
  );
  const displayTopics = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.trendingTopics, keyword, ["topic"]),
        dashboard.trendingTopics,
        6
      ),
    [dashboard.trendingTopics, keyword]
  );

  const displayHashtags = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.trendingHashtags, keyword, ["tag"]),
        dashboard.trendingHashtags,
        6
      ),
    [dashboard.trendingHashtags, keyword]
  );

  const displayCategories = useMemo(
    () => filterOverviewRows(dashboard.popularCategories, keyword, ["name"]),
    [dashboard.popularCategories, keyword]
  );

  const displayOpportunity = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.opportunityRadarItems, keyword, [
          "label",
          "signal",
        ]),
        dashboard.opportunityRadarItems,
        4
      ),
    [dashboard.opportunityRadarItems, keyword]
  );

  const displaySaturation = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.nicheSaturationItems, keyword, [
          "niche",
          "label",
        ]),
        dashboard.nicheSaturationItems,
        4
      ),
    [dashboard.nicheSaturationItems, keyword]
  );

  const displayRisingStars = useMemo(
    () =>
      fillToCount(
        filterOverviewRows(dashboard.risingStarPages, keyword, ["pageName"]),
        dashboard.risingStarPages,
        4
      ),
    [dashboard.risingStarPages, keyword]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto bg-white dark:bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="flex shrink-0 items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm shadow-blue-600/20">
                <svg
                  className="h-4 w-4 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                  />
                </svg>
              </span>
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
                Page<span className="text-blue-600 dark:text-blue-400">IQ</span>
              </span>
            </Link>
            <div className="hidden h-5 w-px bg-slate-200 dark:bg-zinc-700 sm:block" />
            <p className="min-w-0 text-xs text-slate-600 dark:text-zinc-400 sm:text-sm">
              <span className="font-medium text-slate-900 dark:text-white">
                Total Facebook Pages Analyzed:{" "}
              </span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-white">
                {formatTotal(dashboard.totalPagesAnalyzed)}
              </span>
              <span className="ml-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                +{formatTotal(dashboard.addedToday)} today
              </span>
            </p>
          </div>

          <div className="flex items-start gap-2">
          <div className="flex min-w-0 flex-1 flex-col gap-1 sm:max-w-md">
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={FACEBOOK_PAGE_SEARCH_PLACEHOLDER}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500"
              />
            </div>
            <FacebookSearchTip />
          </div>
          <AppTopActions />
          </div>
        </div>
      </header>

      <main className="space-y-4 p-4">
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={panelClass}>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
              <div className="min-w-0 flex-1">
                <SectionTitleRow
                  title="Recently Added Outlier Pages"
                  period={outliersPeriod}
                  onPeriodChange={setOutliersPeriod}
                  selectId="outliers-period"
                />
              </div>
              <Link href="/pages" className={viewAllClass}>
                View All
              </Link>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {displayOutliers.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/dashboard?q=${encodeURIComponent(row.searchQuery)}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  >
                    <img
                      src={row.profilePictureUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {row.pageName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {row.followerCount} followers
                      </p>
                    </div>
                    <div className="w-24 shrink-0 text-right">
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {row.multiplier.toFixed(2)}x
                      </p>
                      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                        <div
                          className="h-full rounded-full bg-emerald-500"
                          style={{ width: multiplierBarWidth(row.multiplier) }}
                        />
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
              {displayOutliers.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-slate-500 dark:text-zinc-400">
                  No outlier pages match your search.
                </li>
              ) : null}
            </ul>
          </section>

          <section className={panelClass}>
            <div className="flex items-start justify-between gap-2 border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
              <div className="min-w-0 flex-1">
                <SectionTitleRow
                  title="Pages with High Future Competition"
                  period={competitionPeriod}
                  onPeriodChange={setCompetitionPeriod}
                  selectId="competition-period"
                />
              </div>
              <Link href="/pages" className={viewAllClass}>
                View All
              </Link>
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {displayCompetition.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/dashboard?q=${encodeURIComponent(row.searchQuery)}`}
                    className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                  >
                    <img
                      src={row.profilePictureUrl}
                      alt=""
                      className="h-9 w-9 shrink-0 rounded-full object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                        {row.pageName}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                        {row.followerCount} followers
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Avg views</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {row.avgViews}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Posts</p>
                      <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                        {row.uploadsCount}
                      </p>
                    </div>
                    <div className="w-12 shrink-0 text-right">
                      <p className="text-[10px] text-slate-500 dark:text-zinc-400">Outlier</p>
                      <p className="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {row.outlierScore}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
              {displayCompetition.length === 0 ? (
                <li className="px-4 py-6 text-center text-xs text-slate-500 dark:text-zinc-400">
                  No competition pages match your search.
                </li>
              ) : null}
            </ul>
          </section>
        </div>

        <section>
          <div className="mb-2">
            <SectionTitleRow
              title="Trending Topics"
              period={topicsPeriod}
              onPeriodChange={setTopicsPeriod}
              selectId="topics-period"
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {displayTopics.map((topic) => (
              <article key={topic.id} className={`${panelClass} p-3`}>
                <p className="line-clamp-2 text-sm font-medium text-slate-900 dark:text-white">
                  {topic.topic}
                </p>
                <p className="mt-1 text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  +{topic.engagementLift}%
                </p>
                <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-400">
                  {topic.postVolume}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2">
            <SectionTitleRow
              title="Trending Hashtags"
              period={hashtagsPeriod}
              onPeriodChange={setHashtagsPeriod}
              selectId="hashtags-period"
            />
          </div>
          <div className="grid grid-cols-6 gap-2">
            {displayHashtags.map((hashtag) => (
              <article key={hashtag.id} className={`${panelClass} p-3`}>
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                  {hashtag.tag}
                </p>
                <p className="mt-1 text-[11px] text-slate-500 dark:text-zinc-400">
                  {hashtag.postCount}
                </p>
                <p className="mt-1 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  +{hashtag.increasePercent}%
                </p>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-emerald-500/80"
                    style={{ width: `${hashtag.momentum}%` }}
                  />
                </div>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-2">
            <SectionTitleRow
              title="Most Popular Categories"
              period={categoriesPeriod}
              onPeriodChange={setCategoriesPeriod}
              selectId="categories-period"
            />
          </div>
          <div className="grid grid-cols-5 gap-2">
            {displayCategories.map((cat) => (
              <article key={cat.id} className={`${panelClass} p-3`}>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {cat.pageCount.toString()} pages · {cat.sharePercent}% share
                </p>
                <p className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  +{cat.engagementLift}% engagement
                </p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className={panelClass}>
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
              <SectionTitleRow
                title="Opportunity Radar"
                period={opportunityPeriod}
                onPeriodChange={setOpportunityPeriod}
                selectId="opportunity-period"
              />
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {displayOpportunity.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {item.signal}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    {item.score}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          <section className={panelClass}>
            <div className="border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
              <SectionTitleRow
                title="Niche Saturation Index"
                period={saturationPeriod}
                onPeriodChange={setSaturationPeriod}
                selectId="saturation-period"
              />
            </div>
            <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
              {displaySaturation.map((item) => (
                <li key={item.id} className="px-4 py-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {item.niche}
                    </p>
                    <span className="shrink-0 text-[11px] font-medium text-slate-500 dark:text-zinc-400">
                      {item.label}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                    <div
                      className={`h-full rounded-full ${
                        item.saturationPercent >= 80
                          ? "bg-red-500"
                          : item.saturationPercent >= 60
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                      style={{ width: `${item.saturationPercent}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">
                    {item.saturationPercent}% saturated
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <section className={panelClass}>
          <div className="border-b border-slate-100 px-4 py-2.5 dark:border-zinc-800">
            <SectionTitleRow
              title="Rising Stars"
              period={risingStarsPeriod}
              onPeriodChange={setRisingStarsPeriod}
              selectId="rising-stars-period"
            />
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
            {displayRisingStars.map((row) => (
              <li key={row.id}>
                <Link
                  href={`/dashboard?q=${encodeURIComponent(row.searchQuery)}`}
                  className="flex items-center gap-3 px-4 py-2.5 transition hover:bg-slate-50 dark:hover:bg-zinc-800/50"
                >
                  <img
                    src={row.profilePictureUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900 dark:text-white">
                      {row.pageName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-zinc-400">
                      {row.followerCount} followers
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                    +{row.growthPercent}%
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
