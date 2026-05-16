"use client";

import type { PageResult } from "@/app/dashboard/page-search-bar";
import { AppTopActions } from "@/components/app-top-actions";
import { EarningPotentialBadge } from "@/components/earning-potential-badge";
import { PagesFilterModal } from "@/components/pages-filter-modal";
import { FACEBOOK_PAGE_SEARCH_PLACEHOLDER } from "@/lib/facebook-search-copy";
import {
  applyAdvancedFilters,
  countActiveAdvancedFilters,
  DEFAULT_PAGE_ADVANCED_FILTERS,
  type PageAdvancedFilters,
} from "@/lib/pages-advanced-filters";
import { DataSourceBadge } from "@/components/score-badges";
import { pageResultToTrendingPage } from "@/lib/discover-live";
import {
  enrichTrendingPage,
  filterPagesByTab,
  PAGE_FILTER_TABS,
  pageListItems,
  sortPageList,
  type PageFilterTab,
  type PageListItem,
  type PageSortKey,
  type PopularPost,
} from "@/lib/pages-list-data";
import { normalizePageUrl } from "@/lib/page-url";
import { simulatedMomTrend, type MomTrend } from "@/lib/stat-mom-trend";
import { outlierTrafficLevel, trafficBarClass } from "@/lib/traffic-light";
import Link from "next/link";
import { FormEvent, useCallback, useMemo, useState } from "react";

type SortDirection = "asc" | "desc";

const DISPLAY_COUNT = 6;

const SORT_COLUMNS: { key: PageSortKey; label: string }[] = [
  { key: "followers", label: "Followers" },
  { key: "avgViewsPerReel", label: "Avg Views Per Reel" },
  { key: "avgEngagementPerTextPost", label: "Avg Engagement Per Text Post" },
  { key: "daysSinceStart", label: "Days Since Start" },
  { key: "numberOfPosts", label: "Number of Posts" },
  { key: "outlierScore", label: "Outlier Score" },
];

const iconBtnClass =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition hover:bg-slate-50 hover:text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200";

function pageInitials(name: string) {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase() || "?"
  );
}

function SortIcon({
  active,
  direction,
}: {
  active: boolean;
  direction: SortDirection;
}) {
  return (
    <svg
      className={`h-3.5 w-3.5 shrink-0 ${active ? "text-slate-700 dark:text-zinc-200" : "text-slate-300 dark:text-zinc-600"}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      {direction === "asc" ? (
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      )}
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  );
}

function EngagementIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  );
}

function TrendIcon() {
  return (
    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function MomTrendIndicator({ trend }: { trend: MomTrend }) {
  return (
    <p
      className={`mt-0.5 text-[10px] font-medium tabular-nums ${
        trend.positive
          ? "text-emerald-600 dark:text-emerald-400"
          : "text-red-600 dark:text-red-400"
      }`}
    >
      {trend.label}
    </p>
  );
}

function StatTile({
  icon,
  label,
  value,
  estimateLabel,
  periodSubtitle,
  momTrend,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  estimateLabel?: string;
  periodSubtitle?: string;
  momTrend?: MomTrend;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-lg border border-slate-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex min-w-0 items-center gap-2">
        {icon}
        <span className="truncate text-[11px] font-medium text-slate-500 dark:text-zinc-400">
          {label}
        </span>
      </div>
      <div className="mt-2">{value}</div>
      {periodSubtitle ? (
        <p className="mt-0.5 text-[9px] font-medium text-slate-400 dark:text-zinc-500">
          {periodSubtitle}
        </p>
      ) : null}
      {momTrend ? <MomTrendIndicator trend={momTrend} /> : null}
      {estimateLabel ? (
        <p className="mt-0.5 text-[9px] font-medium text-slate-400 dark:text-zinc-500">
          {estimateLabel}
        </p>
      ) : null}
      {children}
    </div>
  );
}

function formatEngagementCount(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

function LikeIcon() {
  return (
    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
      />
    </svg>
  );
}

function PostEngagementStats({ post }: { post: PopularPost }) {
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] tabular-nums text-slate-500 dark:text-zinc-400">
      <span className="inline-flex items-center gap-1" title="Likes">
        <LikeIcon />
        <span className="font-medium text-slate-700 dark:text-zinc-300">
          {formatEngagementCount(post.likes)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1" title="Comments">
        <CommentIcon />
        <span className="font-medium text-slate-700 dark:text-zinc-300">
          {formatEngagementCount(post.comments)}
        </span>
      </span>
      <span className="inline-flex items-center gap-1" title="Shares">
        <ShareIcon />
        <span className="font-medium text-slate-700 dark:text-zinc-300">
          {formatEngagementCount(post.shares)}
        </span>
      </span>
    </div>
  );
}

function formatFollowersLine(page: PageListItem): string {
  const base = `${page.followerCount} followers`;
  if (page.country) return `${base} · ${page.country}`;
  return base;
}

function PostCard({
  post,
  fallbackPageUrl,
}: {
  post: PopularPost;
  fallbackPageUrl: string;
}) {
  const [thumbFailed, setThumbFailed] = useState(false);
  const showThumbnail = Boolean(post.thumbnailUrl) && !thumbFailed;
  const href = post.postUrl?.startsWith("http") ? post.postUrl : fallbackPageUrl;

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex min-w-0 flex-col rounded-lg outline-none transition hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-blue-500/40"
    >
      <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-100 transition group-hover:border-blue-300 group-hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:border-blue-500/50">
        {showThumbnail ? (
          <img
            src={post.thumbnailUrl!}
            alt=""
            className="aspect-[16/10] w-full object-cover transition group-hover:brightness-95 dark:group-hover:brightness-110"
            onError={() => setThumbFailed(true)}
          />
        ) : (
          <div
            className="relative flex aspect-[16/10] w-full items-end p-2.5"
            style={{
              background: `linear-gradient(160deg, hsl(${post.thumbnailHue} 42% 42%), hsl(${post.thumbnailHue} 32% 28%))`,
            }}
          >
            <p className="line-clamp-2 text-[11px] font-medium leading-snug text-white/90 drop-shadow-sm">
              {post.title}
            </p>
          </div>
        )}
        <span className="absolute bottom-2 left-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          {post.viewsRaw > 0 ? post.views : post.overlayLabel}
        </span>
        {post.isOutlier ? (
          <span className="absolute right-2 top-2 rounded bg-gradient-to-r from-violet-600 to-indigo-600 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white shadow">
            Outlier
          </span>
        ) : null}
      </div>
      <PostEngagementStats post={post} />
      <p className="mt-1.5 line-clamp-2 text-xs font-medium leading-snug text-slate-800 transition group-hover:text-blue-700 dark:text-zinc-200 dark:group-hover:text-blue-300">
        {post.title}
      </p>
      <p className="mt-0.5 text-[11px] text-slate-500 transition group-hover:text-slate-600 dark:text-zinc-400 dark:group-hover:text-zinc-300">
        {post.timeAgo}
      </p>
    </a>
  );
}

function PageCard({
  page,
  collapsed,
  onToggle,
  bookmarked,
  onBookmark,
}: {
  page: PageListItem;
  collapsed: boolean;
  onToggle: () => void;
  bookmarked: boolean;
  onBookmark: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const outlierLevel = outlierTrafficLevel(page.outlierScore);
  const barPercent = `${Math.min(100, Math.max(12, page.outlierScore))}%`;
  const analyzeHref = `/dashboard?q=${encodeURIComponent(page.searchQuery)}`;
  const pageFacebookUrl = normalizePageUrl(page.searchQuery);
  const momReel = simulatedMomTrend(page.outlierScore, "reel", page.id);
  const momImage = simulatedMomTrend(page.outlierScore, "image", page.id);
  const momText = simulatedMomTrend(page.outlierScore, "text", page.id);
  const momDays = simulatedMomTrend(page.outlierScore, "days", page.id);
  const momPosts = simulatedMomTrend(page.outlierScore, "posts", page.id);
  const momOutlier = simulatedMomTrend(page.outlierScore, "outlier", page.id);

  const handleShare = async () => {
    const url = `${window.location.origin}/dashboard?q=${encodeURIComponent(page.searchQuery)}`;
    if (navigator.share) {
      await navigator.share({ title: page.pageName, url }).catch(() => undefined);
      return;
    }
    await navigator.clipboard.writeText(url).catch(() => undefined);
  };

  return (
    <article className="w-full overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="flex items-center gap-3 border-b border-slate-100 px-3 py-3 dark:border-zinc-800">
        {!imgFailed ? (
          <img
            src={page.profilePictureUrl}
            alt=""
            className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-200 dark:ring-zinc-700"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-300">
            {pageInitials(page.pageName).slice(0, 2)}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={analyzeHref}
              className="truncate text-sm font-semibold text-slate-900 hover:text-slate-700 dark:text-white dark:hover:text-zinc-200"
            >
              {page.pageName}
            </Link>
            <EarningPotentialBadge page={page} />
            {page.monetized ? (
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-emerald-500"
                title="Monetized"
              />
            ) : null}
            {page.source === "live" ? (
              <DataSourceBadge fromCache={page.fromCache} />
            ) : null}
            <span className="rounded-md border border-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:border-zinc-700 dark:text-zinc-400">
              {page.niche}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            {formatFollowersLine(page)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onBookmark}
            className={iconBtnClass}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark page"}
          >
            <svg
              className={`h-4 w-4 ${bookmarked ? "fill-slate-700 text-slate-700 dark:fill-zinc-200 dark:text-zinc-200" : ""}`}
              fill={bookmarked ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => void handleShare()}
            className={iconBtnClass}
            aria-label="Share page"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onToggle}
            className={iconBtnClass}
            aria-label={collapsed ? "Expand page" : "Collapse page"}
            aria-expanded={!collapsed}
          >
            <svg
              className={`h-4 w-4 transition ${collapsed ? "" : "rotate-180"}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>
      </div>

      {!collapsed ? (
        <div className="px-3 pb-3 pt-3">
          <div className="grid grid-cols-6 gap-2">
            <StatTile
              icon={<EyeIcon />}
              label="Avg Views Per Reel"
              periodSubtitle={page.reelAvgPeriod}
              momTrend={momReel}
              estimateLabel={
                page.usesRealReelViews
                  ? undefined
                  : page.avgViewsPerReelEstimated
                    ? "Est."
                    : undefined
              }
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.avgViewsPerReel}
                </p>
              }
            />
            <StatTile
              icon={<ImageIcon />}
              label="Avg Engagement Per Image"
              periodSubtitle={page.imageAvgPeriod}
              momTrend={momImage}
              estimateLabel={
                page.usesRealImageViews
                  ? undefined
                  : page.avgEngagementPerImageEstimated
                    ? "Est."
                    : undefined
              }
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.avgEngagementPerImage}
                </p>
              }
            />
            <StatTile
              icon={<EngagementIcon />}
              label="Avg Engagement Per Text Post"
              periodSubtitle={page.textAvgPeriod}
              momTrend={momText}
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.avgEngagementPerTextPost}
                </p>
              }
            />
            <StatTile
              icon={<CalendarIcon />}
              label="Days Since Start"
              momTrend={momDays}
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.daysSinceStart.toString()}
                </p>
              }
            />
            <StatTile
              icon={<UploadIcon />}
              label="Posts"
              momTrend={momPosts}
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.numberOfPosts.toString()}
                </p>
              }
            />
            <StatTile
              icon={<TrendIcon />}
              label="Outlier Score"
              momTrend={momOutlier}
              value={
                <p className="text-lg font-semibold tabular-nums text-slate-900 dark:text-white">
                  {page.outlierMultiplier}
                </p>
              }
            >
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${trafficBarClass(outlierLevel)}`}
                  style={{ width: barPercent }}
                />
              </div>
            </StatTile>
          </div>

          <div className="mt-4">
            <Link
              href={analyzeHref}
              className="mb-3 inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 dark:text-zinc-300 dark:hover:text-white"
            >
              Most Popular Posts
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
            <div className="grid grid-cols-4 gap-3">
              {page.popularPosts.slice(0, 4).map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  fallbackPageUrl={pageFacebookUrl}
                />
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function PagesClient() {
  const [addQuery, setAddQuery] = useState("");
  const [activeTab, setActiveTab] = useState<PageFilterTab>("All Pages");
  const [sortKey, setSortKey] = useState<PageSortKey>("outlierScore");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => new Set());
  const [liveItems, setLiveItems] = useState<PageListItem[]>([]);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<PageAdvancedFilters>(
    DEFAULT_PAGE_ADVANCED_FILTERS
  );
  const [appliedFilters, setAppliedFilters] = useState<PageAdvancedFilters>(
    DEFAULT_PAGE_ADVANCED_FILTERS
  );

  const activeFilterCount = useMemo(
    () => countActiveAdvancedFilters(appliedFilters),
    [appliedFilters]
  );

  const allItems = useMemo(
    () => [...liveItems, ...pageListItems.filter((p) => !liveItems.some((l) => l.id === p.id))],
    [liveItems]
  );

  const liveOrder = useMemo(
    () => new Map(liveItems.map((page, index) => [page.id, index])),
    [liveItems]
  );

  const visiblePages = useMemo(() => {
    const filtered = applyAdvancedFilters(
      filterPagesByTab(allItems, activeTab),
      appliedFilters
    );

    const live = filtered.filter((page) => page.source === "live");
    const curated = sortPageList(
      filtered.filter((page) => page.source !== "live"),
      sortKey,
      sortDirection
    );

    const sortedLive = [...live].sort(
      (a, b) => (liveOrder.get(a.id) ?? 0) - (liveOrder.get(b.id) ?? 0)
    );

    return [...sortedLive, ...curated].slice(0, DISPLAY_COUNT);
  }, [allItems, activeTab, appliedFilters, sortKey, sortDirection, liveOrder]);

  const handleSort = useCallback((key: PageSortKey) => {
    if (sortKey === key) {
      setSortDirection((dir) => (dir === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("desc");
    }
  }, [sortKey]);

  const toggleCollapsed = useCallback((id: string) => {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const runAddPage = useCallback(
    async (e: FormEvent) => {
      e.preventDefault();
      const trimmed = addQuery.trim();
      if (!trimmed || addLoading) return;

      setAddLoading(true);
      setAddError(null);

      try {
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}`
        );

        let data: PageResult & { error?: string };
        try {
          data = (await response.json()) as PageResult & { error?: string };
        } catch {
          throw new Error("Could not read the server response.");
        }

        if (!response.ok) {
          throw new Error(data.error ?? "Could not fetch page data from Facebook.");
        }

        if (!data.pageName) {
          throw new Error("No page data returned. Check the URL or page name and try again.");
        }

        const trending = pageResultToTrendingPage(data, trimmed);
        const hasEstimatedViews =
          data.estimatedAvgViewsPerReel != null ||
          data.estimatedAvgViewsPerImage != null ||
          data.estimatedAvgViewsPerText != null;

        const item = enrichTrendingPage(
          { ...trending, source: "live" },
          {
            fromCache: data.fromCache,
            ...(data.popularPosts?.length
              ? { popularPosts: data.popularPosts }
              : {}),
            ...(hasEstimatedViews ||
            data.usesRealReelViews ||
            data.usesRealImageViews ||
            data.usesRealTextEngagement
              ? {
                  estimatedAvgViews: {
                    reel: data.estimatedAvgViewsPerReel,
                    image: data.estimatedAvgViewsPerImage,
                    text: data.estimatedAvgViewsPerText,
                    reelFromRealViews: data.usesRealReelViews === true,
                    imageFromRealViews: data.usesRealImageViews === true,
                    textFromRealEngagement: data.usesRealTextEngagement === true,
                    reelAvgPeriod: data.reelAvgPeriod,
                    imageAvgPeriod: data.imageAvgPeriod,
                    textAvgPeriod: data.textAvgPeriod,
                  },
                }
              : {}),
          }
        );

        setLiveItems((prev) => [item, ...prev.filter((p) => p.id !== item.id)]);
        setActiveTab("All Pages");
        setCollapsedIds((prev) => {
          const next = new Set(prev);
          next.delete(item.id);
          return next;
        });
        setAddQuery("");
      } catch (err) {
        setAddError(
          err instanceof Error
            ? err.message
            : "Could not fetch page data. Please try again."
        );
      } finally {
        setAddLoading(false);
      }
    },
    [addQuery, addLoading]
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-white dark:bg-zinc-950">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 px-3 py-2.5 dark:border-zinc-800">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 shadow-sm shadow-blue-600/20">
              <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
            <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white">
              Page<span className="text-blue-600 dark:text-blue-400">IQ</span>
            </span>
          </Link>
          <div className="hidden h-6 w-px shrink-0 bg-slate-200 dark:bg-zinc-700 sm:block" />
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0">
            <h1 className="text-sm font-bold text-slate-900 dark:text-white">Pages</h1>
            <span className="text-[11px] text-slate-500 dark:text-zinc-400">
              {visiblePages.length} of {DISPLAY_COUNT} pages shown
            </span>
          </div>
        </div>
        <AppTopActions />
      </header>

      <div className="sticky top-0 z-30 shrink-0 border-b border-slate-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <form onSubmit={runAddPage} className="space-y-2 border-b border-slate-100 px-3 py-2.5 dark:border-zinc-800">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="search"
              value={addQuery}
              onChange={(e) => {
                setAddQuery(e.target.value);
                if (addError) setAddError(null);
              }}
              placeholder={FACEBOOK_PAGE_SEARCH_PLACEHOLDER}
              disabled={addLoading}
              aria-busy={addLoading}
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-10 pr-24 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-500"
            />
            <button
              type="button"
              onClick={() => {
                setDraftFilters(appliedFilters);
                setFiltersOpen(true);
              }}
              className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Filters
              {activeFilterCount > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              ) : null}
            </button>
          </div>
          {addLoading ? (
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Fetching live page data from Facebook via Apify…
            </p>
          ) : null}
          {addError ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
            >
              {addError}
            </p>
          ) : null}
        </form>

        <div className="flex gap-1 overflow-x-auto px-3 py-2 scrollbar-none">
          {PAGE_FILTER_TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  active
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-slate-900"
                    : "text-slate-600 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                }`}
              >
                {tab}
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-[minmax(0,2fr)_repeat(6,minmax(0,1fr))] gap-3 border-t border-slate-100 bg-slate-50/80 px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-400">
          <span>Page</span>
          {SORT_COLUMNS.map((col) => (
            <button
              key={col.key}
              type="button"
              onClick={() => handleSort(col.key)}
              className="inline-flex items-center justify-end gap-1 transition hover:text-slate-800 dark:hover:text-zinc-200"
            >
              <span className="truncate">{col.label}</span>
              <SortIcon active={sortKey === col.key} direction={sortKey === col.key ? sortDirection : "desc"} />
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50/50 dark:bg-zinc-950">
        <div className="flex w-full flex-col gap-2 px-2 py-2">
          {visiblePages.length === 0 ? (
            <p className="py-12 text-center text-sm text-slate-500 dark:text-zinc-400">
              No pages match this filter. Try another tab or search term.
            </p>
          ) : (
            visiblePages.map((page) => (
              <PageCard
                key={page.id}
                page={page}
                collapsed={collapsedIds.has(page.id)}
                onToggle={() => toggleCollapsed(page.id)}
                bookmarked={bookmarkedIds.has(page.id)}
                onBookmark={() => toggleBookmark(page.id)}
              />
            ))
          )}
        </div>
      </div>

      <PagesFilterModal
        open={filtersOpen}
        draft={draftFilters}
        onChange={setDraftFilters}
        onClose={() => setFiltersOpen(false)}
        onReset={() => setDraftFilters(DEFAULT_PAGE_ADVANCED_FILTERS)}
        onApply={() => {
          setAppliedFilters(draftFilters);
          setFiltersOpen(false);
        }}
      />
    </div>
  );
}
