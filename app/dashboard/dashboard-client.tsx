"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  PageSearchBar,
  type PageResult,
} from "./page-search-bar";

function piqLabel(score: number) {
  if (score >= 85) return "Exceptional";
  if (score >= 72) return "Strong";
  if (score >= 60) return "Growing";
  return "Emerging";
}

function engagementSeriesFromScore(piqScore: number, pageName: string) {
  const seed = pageName.split("").reduce((h, c) => h + c.charCodeAt(0), 0);
  return Array.from({ length: 30 }, (_, i) => {
    const wave = Math.sin((i + seed) * 0.45) * 12;
    const trend = i * 0.8;
    return Math.round(Math.max(20, piqScore * 0.6 + wave + trend));
  });
}

function DefaultDashboardMain() {
  const engagementByDay = [
    42, 38, 55, 48, 62, 58, 71, 65, 78, 72, 85, 80, 76, 88, 92, 86, 94, 90,
    98, 95, 102, 88, 91, 105, 110, 98, 115, 108, 120, 118,
  ];
  const maxEngagement = Math.max(...engagementByDay);

  const statCards = [
    { label: "Followers", value: "284.2K", change: "+12.4%", positive: true },
    { label: "Engagement Rate", value: "4.8%", change: "+0.6%", positive: true },
    { label: "Posts This Month", value: "24", change: "+3", positive: true },
    { label: "Outlier Posts", value: "7", change: "+2", positive: true },
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            <p
              className={`mt-2 text-sm font-medium ${
                stat.positive ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {stat.change} vs last month
            </p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Engagement over 30 days
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Daily engagement score across all posts
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Last 30 days
            </span>
          </div>
          <EngagementChart data={engagementByDay} max={maxEngagement} />
        </section>

        <PageHealthPanel piqScore={82} />
      </div>

      <OutlierPostsTable
        posts={outlierPosts}
        subtitle="Posts performing significantly above your page average"
      />
    </>
  );
}

function SearchResultsMain({ result }: { result: PageResult }) {
  const engagementByDay = useMemo(
    () => engagementSeriesFromScore(result.piqScore, result.pageName),
    [result.piqScore, result.pageName]
  );
  const maxEngagement = Math.max(...engagementByDay);

  const initials = result.pageName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  const reach = Math.min(98, Math.max(55, result.piqScore + 8));
  const shares = Math.min(95, Math.max(50, result.piqScore - 4));
  const comments = Math.min(96, Math.max(52, result.piqScore + 2));

  return (
    <>
      <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white shadow-md shadow-blue-600/30">
              {initials}
            </span>
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900">{result.pageName}</h2>
              <p className="text-sm text-slate-500">Facebook Page</p>
              {result.about ? (
                <p className="mt-1 max-w-2xl text-sm text-slate-600">{result.about}</p>
              ) : null}
            </div>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
              PIQ Score
            </p>
            <p className="text-3xl font-bold text-slate-900">
              {result.piqScore}
              <span className="text-base font-medium text-slate-400">/100</span>
            </p>
            <p className="mt-1 text-sm text-blue-600">{piqLabel(result.piqScore)}</p>
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Followers", value: result.followerCount },
          { label: "Engagement rate", value: result.engagementRate },
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
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{stat.value}</p>
            {stat.hint ? (
              <p className="mt-2 text-xs text-slate-400">{stat.hint}</p>
            ) : null}
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm xl:col-span-3">
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">
                Engagement over 30 days
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Estimated daily engagement from sample analysis
              </p>
            </div>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Last 30 days
            </span>
          </div>
          <EngagementChart data={engagementByDay} max={maxEngagement} />
        </section>

        <PageHealthPanel
          piqScore={result.piqScore}
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

function EngagementChart({ data, max }: { data: number[]; max: number }) {
  return (
    <>
      <div className="flex h-48 items-end gap-1">
        {data.map((value, i) => (
          <div key={i} className="group relative flex-1" title={`Day ${i + 1}: ${value}`}>
            <div
              className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 transition group-hover:opacity-100"
              style={{ height: `${(value / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-3 flex justify-between text-xs text-slate-400">
        <span>Day 1</span>
        <span>Day 15</span>
        <span>Day 30</span>
      </div>
    </>
  );
}

function PageHealthPanel({
  piqScore,
  reach,
  shares,
  comments,
}: {
  piqScore: number;
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
    <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20 xl:col-span-2">
      <h2 className="text-lg font-semibold">Page health</h2>
      <p className="mt-2 text-sm text-blue-100">
        Performance index based on PIQ score of {piqScore}/100 — {piqLabel(piqScore)}.
      </p>
      <div className="mt-6 space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-blue-100">{metric.label}</span>
              <span className="font-semibold">{metric.value}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-blue-500/40">
              <div
                className="h-full rounded-full bg-white"
                style={{ width: `${metric.value}%` }}
              />
            </div>
          </div>
        ))}
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
    <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
      <div className="border-b border-blue-100 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              {sampleAnalysis ? "Sample Posts Analysis" : "Top outlier posts"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>
          {sampleAnalysis ? (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-800">
              Sample data
            </span>
          ) : null}
        </div>
        {sampleAnalysis ? (
          <p className="mt-2 text-xs text-slate-500">
            Example posts for this page&apos;s niche until the full Facebook API is
            connected. Outliers are 3×+ above average engagement.
          </p>
        ) : null}
      </div>

      {posts.length === 0 ? (
        <p className="px-6 py-8 text-sm text-slate-600">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80">
                <th className="px-6 py-3 font-semibold text-slate-600">Type</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Post preview</th>
                {sampleAnalysis ? (
                  <th className="px-6 py-3 font-semibold text-slate-600">Posted</th>
                ) : null}
                <th className="px-6 py-3 font-semibold text-slate-600">Multiplier</th>
                <th className="px-6 py-3 font-semibold text-slate-600">Engagement</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post, i) => (
                <tr
                  key={`${post.preview}-${i}`}
                  className="border-b border-slate-50 transition hover:bg-blue-50/40"
                >
                  <td className="px-6 py-4">
                    <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700">
                      {post.type}
                    </span>
                  </td>
                  <td className="max-w-md px-6 py-4 text-slate-700">
                    <p className="line-clamp-2">{post.preview}</p>
                  </td>
                  {sampleAnalysis ? (
                    <td className="px-6 py-4 text-slate-500">{post.postedAt ?? "—"}</td>
                  ) : null}
                  <td className="px-6 py-4">
                    <span className="font-semibold text-emerald-600">
                      {post.multiplier}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-slate-900">
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
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();

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
  }

  return (
    <>
      <header className="border-b border-blue-100 bg-white px-6 py-4">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-500">
              {result
                ? `Facebook analytics · ${result.pageName}`
                : "Search a Facebook page to view analytics"}
            </p>
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
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            >
              {error}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {result ? <SearchResultsMain result={result} /> : <DefaultDashboardMain />}
      </main>
    </>
  );
}
