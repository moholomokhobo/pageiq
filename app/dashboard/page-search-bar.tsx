"use client";

import { FormEvent } from "react";

export type OutlierPost = {
  preview: string;
  likes: string;
  comments: string;
  shares: string;
  type: "image" | "video" | "text" | "reel";
  multiplier: string;
  totalEngagement: string;
  postedAt: string;
};

export type PageResult = {
  pageName: string;
  about: string;
  followerCount: string;
  engagementRate: string;
  postsLast30Days: number;
  postsThisMonth: number;
  postsToday: number;
  piqScore: number;
  samplePostsAnalysis: boolean;
  profilePictureUrl?: string;
  outlierPosts: OutlierPost[];
};

type PageSearchBarProps = {
  query: string;
  loading: boolean;
  onQueryChange: (value: string) => void;
  onSearch: (e: FormEvent) => void;
};

export function PageSearchBar({
  query,
  loading,
  onQueryChange,
  onSearch,
}: PageSearchBarProps) {
  return (
    <form onSubmit={onSearch} className="flex w-full max-w-3xl gap-1.5">
      <div className="relative min-w-0 flex-1">
        <svg
          className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-zinc-500"
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
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Enter Facebook page URL or name (e.g. facebook.com/nike)"
          disabled={loading}
          className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-8 pr-3 text-xs text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500 dark:focus:bg-zinc-800"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Searching…" : "Search"}
      </button>
    </form>
  );
}
