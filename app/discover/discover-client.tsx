"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import {
  DISCOVER_CATEGORIES,
  DISCOVER_CONTENT_TYPES,
  DISCOVER_COUNTRIES,
  DISCOVER_TIME_PERIODS,
  filterTrendingPages,
  trendingPages,
  type DiscoverCategory,
  type DiscoverContentType,
  type DiscoverCountry,
  type DiscoverTimePeriod,
  type TrendingPage,
} from "@/lib/discover-data";
import { MonetizationCompact } from "@/components/monetization-intelligence";
import { OutlierScoreLabel } from "@/components/outlier-score-label";
import {
  CuratedBadge,
  DataSourceBadge,
  HiddenGemBadge,
  PostOutlierBadge,
} from "@/components/score-badges";
import { pageResultToTrendingPage } from "@/lib/discover-live";
import { calculateMonetizationIntel } from "@/lib/cpm-intelligence";
import {
  calculateOutlierScoreFromStrings,
  isHiddenGemFromStrings,
} from "@/lib/outlier-score";
import {
  engagementTrafficLevelFromString,
  outlierLabel,
  outlierTrafficLevel,
  trafficRingClass,
  trafficTextClass,
} from "@/lib/traffic-light";
import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";

type CategoryFilter = DiscoverCategory | "All";
type ContentFilter = DiscoverContentType | "All";

const filterSelectClass =
  "w-full appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3 pr-9 text-sm font-medium text-slate-800 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-blue-400";

function FilterSelect<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={filterSelectClass}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 dark:text-zinc-500">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </div>
    </label>
  );
}

function estimatedTopPostMultiplier(pageId: string): string {
  const hash = pageId.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return `${(3 + (hash % 55) / 10).toFixed(1)}x`;
}

function TrendingPageCard({ page }: { page: TrendingPage }) {
  const [imgFailed, setImgFailed] = useState(false);
  const isLive = page.source === "live";
  const engLevel = engagementTrafficLevelFromString(page.engagementRate);
  const analyzeHref = `/dashboard?q=${encodeURIComponent(page.searchQuery)}`;
  const monetization = useMemo(
    () =>
      page.monetization ??
      calculateMonetizationIntel({
        pageName: page.pageName,
        followerCount: page.followerCount,
        engagementRate: page.engagementRate,
        contentType: page.contentType,
        homeCountry:
          page.country === "Not listed" ? undefined : page.country,
        postsLast30Days: 12,
      }),
    [page]
  );
  const outlierScore = useMemo(
    () =>
      calculateOutlierScoreFromStrings(
        page.followerCount,
        page.engagementRate,
        monetization.monetizationScore
      ),
    [page, monetization.monetizationScore]
  );
  const outlierLevel = outlierTrafficLevel(outlierScore);
  const hiddenGem = isHiddenGemFromStrings(
    page.followerCount,
    page.engagementRate,
    monetization.monetizationScore
  );
  const topPostMultiplier =
    page.topPostMultiplier ?? estimatedTopPostMultiplier(page.id);

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-xl border bg-white shadow-sm transition hover:shadow-lg dark:bg-zinc-900 ${
        isLive
          ? "border-green-300/80 hover:border-green-400 hover:shadow-green-500/10 dark:border-green-800 dark:hover:border-green-600"
          : "border-slate-200/80 hover:border-amber-300/60 hover:shadow-amber-500/10 dark:border-zinc-700 dark:hover:border-amber-500/40"
      }`}
    >
      {hiddenGem ? (
        <HiddenGemBadge className="absolute left-2 top-2 z-10" />
      ) : null}
      {isLive ? (
        <DataSourceBadge
          fromCache={page.fromCache}
          className="absolute right-2 top-2 z-10"
        />
      ) : page.trendingRank && page.trendingRank <= 3 ? (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
          #{page.trendingRank} Trending
        </span>
      ) : (
        <CuratedBadge className="absolute right-2 top-2 z-10" />
      )}

      <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-blue-50/50 p-3 dark:border-zinc-800 dark:from-zinc-800/80 dark:to-blue-950/30">
        <div className="flex items-start gap-2.5">
          {!imgFailed ? (
            <img
              src={page.profilePictureUrl}
              alt=""
              className={`h-11 w-11 shrink-0 rounded-full object-cover ${trafficRingClass(outlierLevel)}`}
              onError={() => setImgFailed(true)}
            />
          ) : (
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white ${trafficRingClass(outlierLevel)}`}
            >
              {page.pageName.charAt(0)}
            </span>
          )}
          <div className="min-w-0 flex-1 pr-16">
            <h3 className="truncate text-sm font-bold text-slate-900 dark:text-white">
              {page.pageName}
            </h3>
            <div className="mt-0.5 flex flex-wrap gap-1">
              {page.trendingRank && page.trendingRank <= 3 && !isLive ? (
                <CuratedBadge />
              ) : null}
              <span className="rounded-md bg-blue-100 px-1.5 py-0.5 text-[10px] font-semibold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                {page.category}
              </span>
              <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                {page.country}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <dl className="grid grid-cols-3 gap-2 text-center">
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-zinc-500">Followers</dt>
            <dd className="text-xs font-bold text-slate-900 dark:text-white">
              {page.followerCount}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] text-slate-500 dark:text-zinc-500">Engagement</dt>
            <dd className={`text-xs font-bold ${trafficTextClass(engLevel)}`}>
              {page.engagementRate}
            </dd>
          </div>
          <div>
            <dt className="flex justify-center">
              <OutlierScoreLabel />
            </dt>
            <dd className={`text-xs font-bold ${trafficTextClass(outlierLevel)}`}>
              {outlierScore}
            </dd>
          </div>
        </dl>

        <p
          className={`mt-2 text-center text-[10px] font-medium ${trafficTextClass(outlierLevel)}`}
        >
          {outlierLabel(outlierScore)}
        </p>

        <div className="mt-3 rounded-lg border border-dashed border-amber-200/80 bg-amber-50/50 p-2 dark:border-amber-900/50 dark:bg-amber-950/20">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:text-amber-400">
              Top post
            </p>
            <PostOutlierBadge multiplier={topPostMultiplier} />
          </div>
          <p className="mt-1 line-clamp-3 text-xs leading-relaxed text-slate-700 dark:text-zinc-300">
            {page.topPostPreview}
          </p>
          <span className="mt-1.5 inline-block rounded bg-slate-200/80 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-zinc-700 dark:text-zinc-400">
            {page.contentType}
          </span>
        </div>

        <MonetizationCompact intel={monetization} />

        <Link
          href={analyzeHref}
          className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-blue-600/25 transition group-hover:from-blue-700 group-hover:to-blue-800"
        >
          <svg
            className="h-3.5 w-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          Analyze
        </Link>
      </div>
    </article>
  );
}

export function DiscoverClient() {
  const [country, setCountry] = useState<DiscoverCountry>("Global");
  const [category, setCategory] = useState<CategoryFilter>("All");
  const [contentType, setContentType] = useState<ContentFilter>("All");
  const [timePeriod, setTimePeriod] =
    useState<DiscoverTimePeriod>("This Week");
  const [livePages, setLivePages] = useState<TrendingPage[]>([]);
  const [addQuery, setAddQuery] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const categoryOptions: CategoryFilter[] = ["All", ...DISCOVER_CATEGORIES];
  const contentOptions: ContentFilter[] = ["All", ...DISCOVER_CONTENT_TYPES];

  const runAddPage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = addQuery.trim();
      if (!trimmed) return;

      setAddLoading(true);
      setAddError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? "Could not fetch page data.");
        }

        const page = pageResultToTrendingPage(data, trimmed);
        setLivePages((prev) => [
          page,
          ...prev.filter((entry) => entry.id !== page.id),
        ]);
        setAddQuery("");
      } catch (err) {
        setAddError(
          err instanceof Error ? err.message : "Could not fetch page data."
        );
      } finally {
        setAddLoading(false);
      }
    },
    [addQuery]
  );

  const filteredCurated = useMemo(
    () =>
      filterTrendingPages(trendingPages, {
        country,
        category,
        contentType,
        timePeriod,
      }),
    [country, category, contentType, timePeriod]
  );

  const feedPages = useMemo(
    () => [...livePages, ...filteredCurated],
    [livePages, filteredCurated]
  );

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="shrink-0 border-b border-amber-200/50 bg-gradient-to-r from-amber-50 via-white to-blue-50 px-4 py-3 dark:border-amber-900/30 dark:from-amber-950/30 dark:via-zinc-900 dark:to-blue-950/20">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-sm">
                <svg
                  className="h-4 w-4"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </span>
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Trending Feed
              </h1>
            </div>
            <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
              High-opportunity Facebook pages — filter by market, niche, and momentum
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/80 dark:bg-zinc-950">
        <div className="sticky top-0 z-10 shrink-0 border-b border-slate-200/80 bg-slate-50 px-2 py-2 dark:border-zinc-800 dark:bg-zinc-950">
          <section className="mb-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <form
              onSubmit={runAddPage}
              className="flex flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="relative min-w-0 flex-1">
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
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
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Search any Facebook page to add to feed"
                  disabled={addLoading}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-400"
                />
              </div>
              <button
                type="submit"
                disabled={addLoading || !addQuery.trim()}
                className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {addLoading ? "Fetching…" : "Add to feed"}
              </button>
            </form>
            {addError ? (
              <p
                role="alert"
                className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
              >
                {addError}
              </p>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <FilterSelect
                label="Country"
                options={DISCOVER_COUNTRIES}
                value={country}
                onChange={setCountry}
              />
              <FilterSelect
                label="Category"
                options={categoryOptions}
                value={category}
                onChange={setCategory}
              />
              <FilterSelect
                label="Content type"
                options={contentOptions}
                value={contentType}
                onChange={setContentType}
              />
              <FilterSelect
                label="Time period"
                options={DISCOVER_TIME_PERIODS}
                value={timePeriod}
                onChange={setTimePeriod}
              />
            </div>
          </section>

          <div className="mt-2 flex items-center justify-between gap-2 px-0.5">
            <p className="text-xs text-slate-600 dark:text-zinc-400">
              <span className="font-semibold text-slate-900 dark:text-white">
                {feedPages.length}
              </span>{" "}
              {feedPages.length === 1 ? "page" : "pages"} in your feed
              {livePages.length > 0 ? (
                <span className="text-slate-500 dark:text-zinc-500">
                  {" "}
                  · {livePages.length} live
                </span>
              ) : null}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-2 pt-2">
          {feedPages.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-zinc-600 dark:bg-zinc-900">
              <p className="text-sm font-medium text-slate-700 dark:text-zinc-300">
                {livePages.length === 0
                  ? "No pages match these filters"
                  : "No curated pages match these filters"}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-500">
                {livePages.length === 0
                  ? "Try Global country, All categories, or search a Facebook page above."
                  : "Your live pages stay pinned at the top. Relax filters to see more curated picks."}
              </p>
            </div>
          ) : (
            <div className="grid w-full gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
              {feedPages.map((page) => (
                <TrendingPageCard key={page.id} page={page} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
