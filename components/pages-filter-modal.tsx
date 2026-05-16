"use client";

import {
  AVG_VIEWS_RANGE_OPTIONS,
  DAYS_RANGE_OPTIONS,
  EARNING_POTENTIAL_FILTER_OPTIONS,
  FOLLOWERS_RANGE_OPTIONS,
  POSTS_RANGE_OPTIONS,
  type PageAdvancedFilters,
  type TriStateFilter,
} from "@/lib/pages-advanced-filters";
import type { EarningPotentialFilter } from "@/lib/earning-potential";

type PagesFilterModalProps = {
  open: boolean;
  draft: PageAdvancedFilters;
  onChange: (filters: PageAdvancedFilters) => void;
  onClose: () => void;
  onReset: () => void;
  onApply: () => void;
};

const selectClass =
  "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:focus:border-blue-500";

function TriStateGroup({
  label,
  value,
  onChange,
}: {
  label: string;
  value: TriStateFilter;
  onChange: (value: TriStateFilter) => void;
}) {
  const options: { value: TriStateFilter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "yes", label: "Yes" },
    { value: "no", label: "No" },
  ];

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
        {label}
      </p>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-zinc-800">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function EarningPotentialFilterGroup({
  value,
  onChange,
}: {
  value: EarningPotentialFilter;
  onChange: (value: EarningPotentialFilter) => void;
}) {
  return (
    <div className="col-span-2">
      <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
        Earning Potential
      </p>
      <div className="grid grid-cols-4 gap-1 rounded-lg bg-slate-100 p-1 dark:bg-zinc-800">
        {EARNING_POTENTIAL_FILTER_OPTIONS.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value as EarningPotentialFilter)}
              className={`rounded-md px-1.5 py-1.5 text-[10px] font-medium leading-tight transition sm:text-xs ${
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MonetizationGroup({
  value,
  onChange,
}: {
  value: PageAdvancedFilters["monetization"];
  onChange: (value: PageAdvancedFilters["monetization"]) => void;
}) {
  const options: { value: PageAdvancedFilters["monetization"]; label: string }[] =
    [
      { value: "all", label: "All" },
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ];

  return (
    <div>
      <p className="mb-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300">
        Monetization Status
      </p>
      <div className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-zinc-800">
        {options.map((option) => {
          const active = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition ${
                active
                  ? "bg-white text-slate-900 shadow-sm dark:bg-zinc-700 dark:text-white"
                  : "text-slate-600 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function PagesFilterModal({
  open,
  draft,
  onChange,
  onClose,
  onReset,
  onApply,
}: PagesFilterModalProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pages-filter-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label="Close filters"
        onClick={onClose}
      />
      <div className="relative grid h-[640px] w-[880px] max-w-[calc(100vw-2rem)] grid-rows-[auto_1fr_auto] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-zinc-800">
          <h2
            id="pages-filter-title"
            className="text-base font-semibold text-slate-900 dark:text-white"
          >
            Advanced Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 overflow-hidden px-5 py-3">
          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <EarningPotentialFilterGroup
              value={draft.earningPotential}
              onChange={(earningPotential) =>
                onChange({ ...draft, earningPotential })
              }
            />
            <MonetizationGroup
              value={draft.monetization}
              onChange={(monetization) => onChange({ ...draft, monetization })}
            />
            <TriStateGroup
              label="Has Reels"
              value={draft.hasReels}
              onChange={(hasReels) => onChange({ ...draft, hasReels })}
            />
            <TriStateGroup
              label="AI Page"
              value={draft.aiPage}
              onChange={(aiPage) => onChange({ ...draft, aiPage })}
            />
            <TriStateGroup
              label="Kids Content"
              value={draft.kidsContent}
              onChange={(kidsContent) => onChange({ ...draft, kidsContent })}
            />
            <TriStateGroup
              label="Faceless Page"
              value={draft.facelessPage}
              onChange={(facelessPage) => onChange({ ...draft, facelessPage })}
            />
          </div>

          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-zinc-800">
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
              Main Metrics
            </h3>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2.5">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Followers
                </span>
                <select
                  className={selectClass}
                  value={draft.followersRange}
                  onChange={(e) =>
                    onChange({ ...draft, followersRange: e.target.value })
                  }
                >
                  {FOLLOWERS_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Avg Views
                </span>
                <select
                  className={selectClass}
                  value={draft.avgViewsRange}
                  onChange={(e) =>
                    onChange({ ...draft, avgViewsRange: e.target.value })
                  }
                >
                  {AVG_VIEWS_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Days Since Start
                </span>
                <select
                  className={selectClass}
                  value={draft.daysSinceStartRange}
                  onChange={(e) =>
                    onChange({ ...draft, daysSinceStartRange: e.target.value })
                  }
                >
                  {DAYS_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-zinc-300">
                  Number of Posts
                </span>
                <select
                  className={selectClass}
                  value={draft.postsRange}
                  onChange={(e) =>
                    onChange({ ...draft, postsRange: e.target.value })
                  }
                >
                  {POSTS_RANGE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
        </div>

        <div className="flex gap-2 border-t border-slate-100 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
          <button
            type="button"
            onClick={onReset}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
          >
            Reset Filters
          </button>
          <button
            type="button"
            onClick={onApply}
            className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition hover:bg-blue-700"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
}
