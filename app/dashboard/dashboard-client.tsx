"use client";

import { AppTopActions } from "@/components/app-top-actions";
import { normalizePageUrl } from "@/lib/page-url";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  engagementTrafficLevelFromString,
  followerGrowthTrafficLevelFromString,
  multiplierTrafficLevelFromString,
  outlierLabel,
  outlierTrafficLevel,
  trafficBarClass,
  trafficTextClass,
} from "@/lib/traffic-light";
import { EngagementChart } from "@/components/engagement-chart";
import { OutlierScoreLabel } from "@/components/outlier-score-label";
import { PostOutlierBadge } from "@/components/score-badges";
import { MonetizationPanel } from "@/components/monetization-intelligence";
import { calculateOutlierScore } from "@/lib/outlier-score";
import { calculateMonetizationIntel } from "@/lib/cpm-intelligence";
import { generateEngagementSeries } from "@/lib/engagement-series";
import {
  PageSearchBar,
  type PageResult,
} from "./page-search-bar";

const cardClass =
  "rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-zinc-900";
const sectionTitleClass = "text-sm font-semibold text-slate-900 dark:text-white";
const sectionSubClass = "mt-0.5 text-xs text-slate-500 dark:text-zinc-400";
const statLabelClass = "text-xs font-medium text-slate-500 dark:text-zinc-400";
const statValueClass = "mt-0.5 text-xl font-bold text-slate-900 dark:text-white";

function pageInitials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function PageAvatar({
  name,
  imageUrl,
  size = "md",
}: {
  name: string;
  imageUrl?: string | null;
  size?: "sm" | "md";
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const sizeClass = size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm";
  const initial = pageInitials(name);

  if (imageUrl && !imageFailed) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`${sizeClass} shrink-0 rounded-full object-cover ring-2 ring-blue-100 dark:ring-zinc-700`}
        onError={() => setImageFailed(true)}
      />
    );
  }

  return (
    <span
      className={`flex ${sizeClass} shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 font-bold text-white shadow-sm`}
    >
      {initial.slice(0, 1)}
    </span>
  );
}

function StatCard({
  label,
  value,
  hint,
  valueClassName = statValueClass,
}: {
  label: string;
  value: string;
  hint?: string;
  valueClassName?: string;
}) {
  return (
    <article className={cardClass}>
      <p className={statLabelClass}>{label}</p>
      <p className={valueClassName}>{value}</p>
      {hint ? (
        <p className="mt-0.5 text-[10px] text-slate-400 dark:text-zinc-500">{hint}</p>
      ) : null}
    </article>
  );
}

function DefaultDashboardMain() {
  const engagementByDay = useMemo(
    () =>
      generateEngagementSeries({
        pageName: "PageIQ Demo",
        outlierScore: 82,
        engagementRate: "4.8%",
        postsLast30Days: 24,
      }),
    []
  );
  const demoMonetization = useMemo(
    () =>
      calculateMonetizationIntel({
        pageName: "PageIQ Demo",
        followerCount: "284.2K",
        engagementRate: "4.8%",
        contentType: "Reels",
        homeCountry: "USA",
        postsLast30Days: 24,
      }),
    []
  );

  const statCards = [
    { label: "Followers", value: "284.2K", change: "+12.4%" },
    { label: "Engagement Rate", value: "4.8%", change: "+0.6%" },
    { label: "Posts Today", value: "2", change: "since midnight" },
    { label: "Posts This Month", value: "24", change: "+3" },
    { label: "Outlier Posts", value: "7", change: "+2" },
  ];

  const outlierPosts = [
    {
      type: "Video",
      preview: "3 hooks that doubled our reach in 48 hours…",
      multiplier: "8.4x",
      engagement: "142K",
    },
    {
      type: "Reel",
      preview: "POV: you spot the trend before your competitors",
      multiplier: "6.2x",
      engagement: "98K",
    },
    {
      type: "Image",
      preview: "Weekly viral score breakdown — May edition",
      multiplier: "5.1x",
      engagement: "76K",
    },
    {
      type: "Carousel",
      preview: "5 posting windows that outperform the algorithm",
      multiplier: "4.7x",
      engagement: "61K",
    },
    {
      type: "Video",
      preview: "Behind the scenes: how we forecast outliers",
      multiplier: "4.2x",
      engagement: "54K",
    },
  ];

  return (
  <>
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {statCards.map((stat) => (
          <article key={stat.label} className={cardClass}>
            <p className={statLabelClass}>{stat.label}</p>
            <p
              className={`mt-0.5 text-xl font-bold ${
                stat.label === "Engagement Rate"
                  ? trafficTextClass(engagementTrafficLevelFromString(stat.value))
                  : "text-slate-900 dark:text-white"
              }`}
            >
              {stat.value}
            </p>
            <p
              className={`mt-0.5 text-[10px] font-medium ${
                stat.change.includes("%")
                  ? trafficTextClass(
                      followerGrowthTrafficLevelFromString(stat.change)
                    )
                  : "text-slate-500 dark:text-zinc-400"
              }`}
            >
              {stat.label === "Posts Today"
                ? stat.change
                : `${stat.change} vs last month`}
            </p>
          </article>
        ))}
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        <section className={`${cardClass} xl:col-span-3`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className={sectionTitleClass}>Engagement over 30 days</h2>
              <p className={sectionSubClass}>
                Daily engagement score across all posts
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-zinc-800 dark:text-blue-400">
              Last 30 days
            </span>
          </div>
          <EngagementChart data={engagementByDay} />
        </section>

        <PageHealthPanel outlierScore={82} />
      </div>

      <div className="mt-3">
        <MonetizationPanel intel={demoMonetization} />
      </div>

      <OutlierPostsTable
        posts={outlierPosts}
        subtitle="Posts performing significantly above your page average"
      />
    </>
  );
}

function SearchResultsMain({
  result,
  pageUrl,
}: {
  result: PageResult;
  pageUrl: string;
}) {
  const [watchlistSaving, setWatchlistSaving] = useState(false);
  const [watchlistSaved, setWatchlistSaved] = useState(false);
  const [watchlistError, setWatchlistError] = useState<string | null>(null);

  async function addToWatchlist() {
    setWatchlistSaving(true);
    setWatchlistError(null);

    try {
      const response = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pageUrl,
          pageName: result.pageName,
          pageFollowers: result.followerCount,
          outlierScore: result.outlierScore,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Could not add to watchlist.");
      }

      setWatchlistSaved(true);
    } catch (err) {
      setWatchlistError(
        err instanceof Error ? err.message : "Could not add to watchlist."
      );
    } finally {
      setWatchlistSaving(false);
    }
  }
  const engagementByDay = useMemo(
    () =>
      generateEngagementSeries({
        pageName: result.pageName,
        outlierScore: result.outlierScore,
        engagementRate: result.engagementRate,
        postsLast30Days: result.postsLast30Days,
      }),
    [
      result.pageName,
      result.outlierScore,
      result.engagementRate,
      result.postsLast30Days,
    ]
  );

  const reach = Math.min(98, Math.max(55, result.outlierScore + 8));
  const shares = Math.min(95, Math.max(50, result.outlierScore - 4));
  const comments = Math.min(96, Math.max(52, result.outlierScore + 2));

  return (
    <>
      <section className={cardClass}>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <PageAvatar
              name={result.pageName}
              imageUrl={result.profilePictureUrl}
            />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {result.pageName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-zinc-400">Facebook Page</p>
              {result.about ? (
                <p className="mt-0.5 line-clamp-2 max-w-2xl text-xs text-slate-600 dark:text-zinc-300">
                  {result.about}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex flex-col items-start gap-2 sm:items-end">
            <div className="text-left sm:text-right">
              <OutlierScoreLabel className="sm:justify-end" />
              <p
                className={`text-2xl font-bold leading-tight ${trafficTextClass(outlierTrafficLevel(result.outlierScore))}`}
              >
                {result.outlierScore}
                <span className="text-sm font-medium text-slate-400 dark:text-zinc-500">
                  /100
                </span>
              </p>
              <p
                className={`text-xs ${trafficTextClass(outlierTrafficLevel(result.outlierScore))}`}
              >
                {outlierLabel(result.outlierScore)}
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={addToWatchlist}
                disabled={watchlistSaving || watchlistSaved}
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                    d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
                  />
                </svg>
                {watchlistSaved
                  ? "On Watchlist"
                  : watchlistSaving
                    ? "Saving…"
                    : "Add to Watchlist"}
              </button>
              {watchlistSaved ? (
                <Link
                  href="/watchlist"
                  className="inline-flex rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50 dark:border-zinc-600 dark:text-blue-400 dark:hover:bg-zinc-800"
                >
                  View Watchlist
                </Link>
              ) : null}
            </div>
            {watchlistError ? (
              <p className="text-xs text-red-600">{watchlistError}</p>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[
          { label: "Followers", value: result.followerCount },
          { label: "Engagement rate", value: result.engagementRate },
          {
            label: "Posts Today",
            value: String(result.postsToday ?? 0),
            hint: "since midnight",
          },
          {
            label: "Last 30 days",
            value: String(result.postsLast30Days),
            hint: "posts in last 30 days",
          },
          {
            label: "This month",
            value: String(result.postsThisMonth),
            hint: "posts this month",
          },
        ].map((stat) => {
          const valueClass =
            stat.label === "Engagement rate"
              ? trafficTextClass(engagementTrafficLevelFromString(stat.value))
              : statValueClass;

          return (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              hint={stat.hint}
              valueClassName={valueClass}
            />
          );
        })}
      </div>

      <div className="mt-3">
        <MonetizationPanel intel={result.monetization} />
      </div>

      <div className="mt-3 grid gap-3 xl:grid-cols-5">
        <section className={`${cardClass} xl:col-span-3`}>
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className={sectionTitleClass}>Engagement over 30 days</h2>
              <p className={sectionSubClass}>
                Estimated daily engagement from sample analysis
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:bg-zinc-800 dark:text-blue-400">
              Last 30 days
            </span>
          </div>
          <EngagementChart data={engagementByDay} />
        </section>

        <PageHealthPanel
          outlierScore={result.outlierScore}
          reach={reach}
          shares={shares}
          comments={comments}
        />
      </div>

      <OutlierPostsTable
        posts={result.outlierPosts.map((post) => ({
          type: post.type,
          preview: post.preview,
          multiplier: post.multiplier,
          engagement: post.totalEngagement,
          postedAt: post.postedAt,
        }))}
        subtitle="Outlier posts from sample analysis (3×+ above average)"
        sampleAnalysis
        emptyMessage={`No outlier posts in the sample set of ${result.postsLast30Days} posts (last 30 days).`}
      />
    </>
  );
}

function PageHealthPanel({
  outlierScore,
  reach,
  shares,
  comments,
}: {
  outlierScore: number;
  reach?: number;
  shares?: number;
  comments?: number;
}) {
  const metrics = [
    { label: "Reach", value: reach ?? 92 },
    { label: "Shares", value: shares ?? 78 },
    { label: "Comments", value: comments ?? 85 },
  ];

  return (
    <section className={`${cardClass} xl:col-span-2`}>
      <h2 className={sectionTitleClass}>Page health</h2>
      <p className={`${sectionSubClass} mt-1`}>
        Outlier{" "}
        <span className={trafficTextClass(outlierTrafficLevel(outlierScore))}>
          {outlierScore}/100
        </span>{" "}
        — {outlierLabel(outlierScore)}.
      </p>
      <div className="mt-3 space-y-2.5">
        {metrics.map((metric) => {
          const level = outlierTrafficLevel(metric.value);
          return (
            <div key={metric.label}>
              <div className="mb-0.5 flex justify-between text-xs">
                <span className="text-slate-500 dark:text-zinc-400">
                  {metric.label}
                </span>
                <span className={`font-semibold ${trafficTextClass(level)}`}>
                  {metric.value}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full ${trafficBarClass(level)}`}
                  style={{ width: `${metric.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

type TablePost = {
  type: string;
  preview: string;
  multiplier: string;
  engagement: string;
  postedAt?: string;
};

function OutlierPostsTable({
  posts,
  subtitle,
  sampleAnalysis = false,
  emptyMessage = "No outlier posts found.",
}: {
  posts: TablePost[];
  subtitle: string;
  sampleAnalysis?: boolean;
  emptyMessage?: string;
}) {
  return (
    <section className={`mt-3 overflow-hidden ${cardClass}`}>
      <div className="border-b border-gray-200 px-3 py-2 dark:border-gray-600">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className={sectionTitleClass}>
              {sampleAnalysis ? "Sample Posts Analysis" : "Top outlier posts"}
            </h2>
            <p className={sectionSubClass}>{subtitle}</p>
          </div>
          {sampleAnalysis ? (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Sample data
            </span>
          ) : null}
        </div>
        {sampleAnalysis ? (
          <p className="mt-1 text-[10px] text-slate-500 dark:text-zinc-400">
            Example posts for this page&apos;s niche until the full Facebook API is
            connected. Outliers are 3×+ above average engagement.
          </p>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <p className="px-3 py-4 text-xs text-slate-600 dark:text-zinc-300">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-slate-50/80 dark:border-gray-600 dark:bg-zinc-800/80">
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-zinc-300">Type</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-zinc-300">Post preview</th>
                {sampleAnalysis ? (
                  <th className="px-3 py-2 font-semibold text-slate-600 dark:text-zinc-300">Posted</th>
                ) : null}
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-zinc-300">Multiplier</th>
                <th className="px-3 py-2 font-semibold text-slate-600 dark:text-zinc-300">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr
                  key={`${post.preview}-${i}`}
                  className="border-b border-gray-200 transition hover:bg-blue-50/40 dark:border-gray-600 dark:hover:bg-zinc-800/60"
                >
                  <td className="px-3 py-2">
                    <span className="inline-flex rounded-md bg-blue-100 px-2 py-0.5 text-[10px] font-semibold capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      {post.type}
                    </span>
                  </td>
                  <td className="max-w-md px-3 py-2 text-slate-700 dark:text-zinc-200">
                    <div className="flex flex-wrap items-start gap-1.5">
                      <p className="line-clamp-2 min-w-0 flex-1">{post.preview}</p>
                      <PostOutlierBadge multiplier={post.multiplier} />
                    </div>
                  </td>
                  {sampleAnalysis ? (
                    <td className="px-3 py-2 text-slate-500 dark:text-zinc-400">{post.postedAt ?? "—"}</td>
                  ) : null}
                  <td className="px-3 py-2">
                    <span
                      className={`font-semibold ${trafficTextClass(
                        multiplierTrafficLevelFromString(post.multiplier)
                      )}`}
                    >
                      {post.multiplier}
                    </span>
                  </td>
                  <td className="px-3 py-2 font-semibold text-slate-900 dark:text-white">
                    {post.engagement}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export function DashboardClient() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";
  const autoSearchRan = useRef(false);

  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runSearch = useCallback(async (searchQuery: string) => {
    const trimmed = searchQuery.trim();

    if (!trimmed) {
      setResult(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch(
        `/api/search?q=${encodeURIComponent(trimmed)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Search failed. Please try again.");
      }

      setResult(data as PageResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Search failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = searchParams.get("q")?.trim();
    if (!q || autoSearchRan.current) return;
    autoSearchRan.current = true;
    setQuery(q);
    void runSearch(q);
  }, [searchParams, runSearch]);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    await runSearch(query);
  }

  return (
    <>
      <header className="border-b border-blue-100 bg-white px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-slate-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                {result
                  ? `Facebook analytics · ${result.pageName}`
                  : "Search a Facebook page to view analytics"}
              </p>
            </div>
            <AppTopActions />
          </div>
          <PageSearchBar
            query={query}
            loading={loading}
            onQueryChange={setQuery}
            onSearch={handleSearch}
          />
          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            >
              {error}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-3">
        {result ? (
          <SearchResultsMain
            result={result}
            pageUrl={normalizePageUrl(query)}
          />
        ) : (
          <DefaultDashboardMain />
        )}
      </main>
    </>
  );
}
