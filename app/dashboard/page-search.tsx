"use client";

import { FormEvent, useState } from "react";

type PageResult = {
  pageName: string;
  followers: string;
  engagementRate: string;
  piqScore: number;
};

function generateMockResult(query: string): PageResult {
  const hash = query
    .toLowerCase()
    .split("")
    .reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
  const abs = Math.abs(hash);

  const followerRaw = 48_000 + (abs % 2_450_000);
  const followers =
    followerRaw >= 1_000_000
      ? `${(followerRaw / 1_000_000).toFixed(1)}M`
      : `${(followerRaw / 1_000).toFixed(1)}K`;

  const engagement = (2 + (abs % 650) / 100).toFixed(1);
  const piqScore = 58 + (abs % 38);

  const pageName = query
    .trim()
    .split(/[\s-_]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

  return {
    pageName: pageName || "Unknown Page",
    followers,
    engagementRate: `${engagement}%`,
    piqScore,
  };
}

function piqLabel(score: number) {
  if (score >= 85) return "Exceptional";
  if (score >= 72) return "Strong";
  if (score >= 60) return "Growing";
  return "Emerging";
}

export function PageSearch() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<PageResult | null>(null);
  const [searched, setSearched] = useState(false);

  function handleSearch(e: FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setResult(null);
      setSearched(false);
      return;
    }
    setResult(generateMockResult(trimmed));
    setSearched(true);
  }

  const initials = result
    ? result.pageName
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <div className="w-full max-w-xl">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
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
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Facebook pages…"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <button
          type="submit"
          className="shrink-0 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
        >
          Search
        </button>
      </form>

      {searched && result && (
        <article className="mt-4 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-lg shadow-blue-900/5">
          <div className="flex items-center gap-4 border-b border-blue-50 bg-gradient-to-r from-blue-50 to-white px-5 py-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-600/30">
              {initials}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-base font-semibold text-slate-900">
                {result.pageName}
              </p>
              <p className="text-xs text-slate-500">Facebook Page · Mock result</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                PIQ Score
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {result.piqScore}
                <span className="text-sm font-medium text-slate-400">/100</span>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-blue-50 px-2 py-4">
            <div className="px-3 text-center">
              <p className="text-xs font-medium text-slate-500">Followers</p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {result.followers}
              </p>
            </div>
            <div className="px-3 text-center">
              <p className="text-xs font-medium text-slate-500">
                Engagement rate
              </p>
              <p className="mt-1 text-lg font-bold text-slate-900">
                {result.engagementRate}
              </p>
            </div>
            <div className="px-3 text-center">
              <p className="text-xs font-medium text-slate-500">Status</p>
              <p className="mt-1 text-lg font-bold text-blue-600">
                {piqLabel(result.piqScore)}
              </p>
            </div>
          </div>

          <div className="border-t border-blue-50 bg-slate-50/50 px-5 py-3">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>PIQ performance index</span>
              <span>{result.piqScore}% of benchmark</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-blue-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
                style={{ width: `${result.piqScore}%` }}
              />
            </div>
          </div>
        </article>
      )}
    </div>
  );
}
