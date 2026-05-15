"use client";

import type { PageResult } from "@/app/dashboard/page-search-bar";
import { OutlierScoreLabel } from "@/components/outlier-score-label";
import { PostOutlierBadge } from "@/components/score-badges";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  pageHealthFromOutlierScore,
  parseCountValue,
  parseEngagementRate,
  pickWinner,
  type CompareWinner,
} from "@/lib/metrics";
import {
  compareBarClass,
  compareMetricCardClass,
  compareMetricTextClass,
  multiplierTrafficLevelFromString,
  outlierLabel,
  outlierTrafficLevel,
  trafficTextClass,
} from "@/lib/traffic-light";
import { FormEvent, useMemo, useState, type ReactNode } from "react";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-zinc-900";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500 dark:focus:bg-zinc-800";

function pageInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

async function fetchPage(query: string): Promise<PageResult> {
  const response = await fetch(
    `/api/search?q=${encodeURIComponent(query)}`
  );
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error ?? "Search failed. Please try again.");
  }
  return data as PageResult;
}

type CompareWinners = {
  followers: CompareWinner;
  engagementRate: CompareWinner;
  outlierScore: CompareWinner;
  postsThisMonth: CompareWinner;
  outlierPosts: CompareWinner;
  reach: CompareWinner;
  shares: CompareWinner;
  comments: CompareWinner;
};

function computeWinners(left: PageResult, right: PageResult): CompareWinners {
  const leftHealth = pageHealthFromOutlierScore(left.outlierScore);
  const rightHealth = pageHealthFromOutlierScore(right.outlierScore);

  return {
    followers: pickWinner(
      parseCountValue(left.followerCount),
      parseCountValue(right.followerCount)
    ),
    engagementRate: pickWinner(
      parseEngagementRate(left.engagementRate),
      parseEngagementRate(right.engagementRate)
    ),
    outlierScore: pickWinner(left.outlierScore, right.outlierScore),
    postsThisMonth: pickWinner(left.postsThisMonth, right.postsThisMonth),
    outlierPosts: pickWinner(
      left.outlierPosts.length,
      right.outlierPosts.length
    ),
    reach: pickWinner(leftHealth.reach, rightHealth.reach),
    shares: pickWinner(leftHealth.shares, rightHealth.shares),
    comments: pickWinner(leftHealth.comments, rightHealth.comments),
  };
}

function CompareInput({
  label,
  value,
  onChange,
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  placeholder: string;
}) {
  return (
    <label className="block min-w-0 flex-1">
      <span className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300">
        {label}
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={inputClass}
      />
    </label>
  );
}

function MetricRow({
  label,
  value,
  side,
  winner,
}: {
  label: ReactNode;
  value: string | number;
  side: "left" | "right";
  winner: CompareWinner;
}) {
  const textClass = compareMetricTextClass(side, winner);

  return (
    <div className={`${cardClass} ${compareMetricCardClass(side, winner)}`}>
      <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold ${textClass}`}>{value}</p>
      {winner !== "tie" ? (
        <p
          className={`mt-1 text-xs font-medium ${
            winner === side
              ? "text-green-600 dark:text-green-400"
              : "text-red-600 dark:text-red-400"
          }`}
        >
          {winner === side ? "Winner" : "Behind"}
        </p>
      ) : null}
    </div>
  );
}

function PageColumn({
  result,
  side,
  winners,
}: {
  result: PageResult;
  side: "left" | "right";
  winners: CompareWinners;
}) {
  const health = pageHealthFromOutlierScore(result.outlierScore);
  const healthMetrics = [
    { key: "reach" as const, label: "Reach", value: health.reach },
    { key: "shares" as const, label: "Shares", value: health.shares },
    { key: "comments" as const, label: "Comments", value: health.comments },
  ];

  return (
    <div className="flex min-w-0 flex-col gap-4">
      <section className={`${cardClass} p-6`}>
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-base font-bold text-white shadow-md shadow-blue-600/30">
            {pageInitials(result.pageName)}
          </span>
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {result.pageName}
            </h2>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Facebook Page
            </p>
          </div>
        </div>
        {result.about ? (
          <p className="mt-3 text-sm text-slate-600 dark:text-zinc-300">
            {result.about}
          </p>
        ) : null}
      </section>

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricRow
          label="Followers"
          value={result.followerCount}
          side={side}
          winner={winners.followers}
        />
        <MetricRow
          label="Engagement rate"
          value={result.engagementRate}
          side={side}
          winner={winners.engagementRate}
        />
        <MetricRow
          label={<OutlierScoreLabel />}
          value={`${result.outlierScore}/100`}
          side={side}
          winner={winners.outlierScore}
        />
        <MetricRow
          label="Posts this month"
          value={result.postsThisMonth}
          side={side}
          winner={winners.postsThisMonth}
        />
        <MetricRow
          label="Outlier posts"
          value={result.outlierPosts.length}
          side={side}
          winner={winners.outlierPosts}
        />
      </div>

      <section className={`${cardClass} p-6`}>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Page health
        </h3>
        <div className="mt-1">
          <OutlierScoreLabel />
        </div>
        <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
          <span className={trafficTextClass(outlierTrafficLevel(result.outlierScore))}>
            {outlierLabel(result.outlierScore)} · Outlier {result.outlierScore}/100
          </span>
        </p>
        <div className="mt-5 space-y-4">
          {healthMetrics.map((metric) => {
            const winner = winners[metric.key];
            return (
              <div key={metric.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className={compareMetricTextClass(side, winner)}>
                    {metric.label}
                    {winner !== "tie"
                      ? winner === side
                        ? " · Winner"
                        : " · Behind"
                      : ""}
                  </span>
                  <span className={compareMetricTextClass(side, winner)}>
                    {metric.value}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                  <div
                    className={`h-full rounded-full ${compareBarClass(side, winner)}`}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className={`${cardClass} overflow-hidden p-0`}>
        <div className="border-b border-gray-200 px-5 py-4 dark:border-gray-600">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Outlier posts
          </h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
            Posts performing 3×+ above average
          </p>
        </div>
        {result.outlierPosts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-slate-600 dark:text-zinc-300">
            No outlier posts in the sample set.
          </p>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-600">
            {result.outlierPosts.map((post, i) => (
              <li key={`${post.preview}-${i}`} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <span className="inline-flex shrink-0 rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold capitalize text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    {post.type}
                  </span>
                  <div className="flex shrink-0 items-center gap-2">
                    <PostOutlierBadge multiplier={post.multiplier} />
                    <span
                      className={`text-sm font-semibold ${trafficTextClass(
                        multiplierTrafficLevelFromString(post.multiplier)
                      )}`}
                    >
                      {post.multiplier}
                    </span>
                  </div>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-slate-700 dark:text-zinc-200">
                  {post.preview}
                </p>
                <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                  {post.totalEngagement} engagement · {post.postedAt}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export function CompareClient() {
  const [leftQuery, setLeftQuery] = useState("");
  const [rightQuery, setRightQuery] = useState("");
  const [left, setLeft] = useState<PageResult | null>(null);
  const [right, setRight] = useState<PageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const winners = useMemo(() => {
    if (!left || !right) return null;
    return computeWinners(left, right);
  }, [left, right]);

  async function handleCompare(e: FormEvent) {
    e.preventDefault();
    const trimmedLeft = leftQuery.trim();
    const trimmedRight = rightQuery.trim();

    if (!trimmedLeft || !trimmedRight) {
      setError("Enter both Facebook page URLs or names to compare.");
      return;
    }

    setLoading(true);
    setError(null);
    setLeft(null);
    setRight(null);

    try {
      const [leftResult, rightResult] = await Promise.all([
        fetchPage(trimmedLeft),
        fetchPage(trimmedRight),
      ]);
      setLeft(leftResult);
      setRight(rightResult);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Comparison failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-600 dark:bg-zinc-900">
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                Compare
              </h1>
              <p className="text-sm text-slate-500 dark:text-zinc-400">
                Compare two Facebook pages side by side
              </p>
            </div>
            <ThemeToggle />
          </div>

          <form onSubmit={handleCompare} className="flex flex-col gap-3">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <CompareInput
                label="Page A"
                value={leftQuery}
                onChange={setLeftQuery}
                disabled={loading}
                placeholder="facebook.com/page-one"
              />
              <CompareInput
                label="Page B"
                value={rightQuery}
                onChange={setRightQuery}
                disabled={loading}
                placeholder="facebook.com/page-two"
              />
              <button
                type="submit"
                disabled={loading}
                className="shrink-0 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 lg:mb-0 lg:self-end"
              >
                {loading ? "Comparing…" : "Compare"}
              </button>
            </div>
          </form>

          {error ? (
            <p
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            >
              {error}
            </p>
          ) : null}
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {loading ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Fetching both pages…
          </p>
        ) : left && right && winners ? (
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PageColumn result={left} side="left" winners={winners} />
            <PageColumn result={right} side="right" winners={winners} />
          </div>
        ) : (
          <div className={`${cardClass} mx-auto max-w-lg p-10 text-center`}>
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              Compare two pages
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Enter two Facebook page URLs or names above and click Compare to
              see followers, engagement, Outlier, outliers, and page health
              side by side.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
