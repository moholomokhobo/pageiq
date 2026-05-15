"use client";

import type { CpmTier, MonetizationIntel } from "@/lib/cpm-intelligence";
import { outlierTrafficLevel, trafficBarClass, trafficTextClass } from "@/lib/traffic-light";

function cpmTierTextClass(tier: CpmTier): string {
  if (tier === "high") return "text-green-600 dark:text-green-400";
  if (tier === "mixed") return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function cpmTierBgClass(tier: CpmTier): string {
  if (tier === "high") return "bg-green-500";
  if (tier === "mixed") return "bg-orange-500";
  return "bg-red-500";
}

function cpmTierRingClass(tier: CpmTier): string {
  if (tier === "high") return "ring-green-500/40";
  if (tier === "mixed") return "ring-orange-500/40";
  return "ring-red-500/40";
}

export function CpmIndicator({
  tier,
  label,
  compact = false,
}: {
  tier: CpmTier;
  label: string;
  compact?: boolean;
}) {
  const short =
    tier === "high" ? "High CPM" : tier === "mixed" ? "Mixed CPM" : "Low CPM";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white dark:border-zinc-600 dark:bg-zinc-800 ${
        compact ? "px-2 py-0.5" : "px-2.5 py-1"
      }`}
      title={label}
    >
      <span
        className={`h-2 w-2 shrink-0 rounded-full ${cpmTierBgClass(tier)}`}
        aria-hidden
      />
      <span className={`text-[10px] font-semibold ${cpmTierTextClass(tier)}`}>
        {compact ? short : label}
      </span>
    </span>
  );
}

export function MonetizationCompact({ intel }: { intel: MonetizationIntel }) {
  const scoreLevel = outlierTrafficLevel(intel.monetizationScore);

  return (
    <div
      className={`mt-3 space-y-2 rounded-lg border p-2 ring-1 ${cpmTierRingClass(intel.cpmTier)} border-slate-200/80 bg-slate-50/80 dark:border-zinc-700 dark:bg-zinc-800/50`}
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">
            Monetization score
          </p>
          <p
            className={`text-lg font-bold leading-tight ${trafficTextClass(scoreLevel)}`}
          >
            {intel.monetizationScore}
            <span className="text-xs font-medium text-slate-400">/100</span>
          </p>
        </div>
        <CpmIndicator tier={intel.cpmTier} label={intel.cpmLabel} compact />
      </div>

      <div>
        <div className="mb-0.5 flex justify-between text-[10px]">
          <span className="text-slate-500 dark:text-zinc-400">High CPM audience</span>
          <span className={`font-semibold ${cpmTierTextClass(intel.cpmTier)}`}>
            {intel.highCpmPercent}%
          </span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
          <div
            className={`h-full rounded-full ${cpmTierBgClass(intel.cpmTier)}`}
            style={{ width: `${intel.highCpmPercent}%` }}
          />
        </div>
        <p className="mt-0.5 text-[10px] text-slate-500 dark:text-zinc-500">
          USA, UK, Australia, Canada
        </p>
      </div>

      <div className="rounded-md bg-emerald-50 px-2 py-1.5 dark:bg-emerald-950/40">
        <p className="text-[10px] font-medium text-emerald-800 dark:text-emerald-400">
          Est. monthly earnings
        </p>
        <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {intel.monthlyEarningsRange}
        </p>
      </div>
    </div>
  );
}

export function MonetizationPanel({ intel }: { intel: MonetizationIntel }) {
  const scoreLevel = outlierTrafficLevel(intel.monetizationScore);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-600 dark:bg-zinc-900">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
            CPM & monetization intelligence
          </h2>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">
            Estimated from audience mix, reach, and content format
          </p>
        </div>
        <CpmIndicator tier={intel.cpmTier} label={intel.cpmLabel} />
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-[10px] font-medium uppercase text-slate-500 dark:text-zinc-400">
            Monetization score
          </p>
          <p className={`mt-0.5 text-2xl font-bold ${trafficTextClass(scoreLevel)}`}>
            {intel.monetizationScore}
            <span className="text-sm font-medium text-slate-400">/100</span>
          </p>
        </article>
        <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-[10px] font-medium uppercase text-slate-500 dark:text-zinc-400">
            High CPM audience
          </p>
          <p className={`mt-0.5 text-2xl font-bold ${cpmTierTextClass(intel.cpmTier)}`}>
            {intel.highCpmPercent}%
          </p>
          <p className="text-[10px] text-slate-500">USA · UK · AU · CA</p>
        </article>
        <article className="rounded-lg border border-slate-100 bg-slate-50/80 p-2.5 dark:border-zinc-700 dark:bg-zinc-800/50">
          <p className="text-[10px] font-medium uppercase text-slate-500 dark:text-zinc-400">
            Est. monthly views
          </p>
          <p className="mt-0.5 text-xl font-bold text-slate-900 dark:text-white">
            {intel.estimatedMonthlyViews.toLocaleString()}
          </p>
        </article>
        <article className="rounded-lg border border-emerald-200 bg-emerald-50/80 p-2.5 dark:border-emerald-900/50 dark:bg-emerald-950/30">
          <p className="text-[10px] font-medium uppercase text-emerald-800 dark:text-emerald-400">
            Est. monthly earnings
          </p>
          <p className="mt-0.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
            {intel.monthlyEarningsRange}
          </p>
        </article>
      </div>

      <div className="mt-3">
        <p className="mb-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          Audience country breakdown
        </p>
        <div className="space-y-1.5">
          {intel.audienceBreakdown.map((slice) => (
            <div key={slice.country}>
              <div className="mb-0.5 flex justify-between text-[10px]">
                <span className="text-slate-600 dark:text-zinc-400">
                  {slice.country}
                  {slice.isHighCpm ? (
                    <span className="ml-1 text-green-600 dark:text-green-400">
                      · High CPM
                    </span>
                  ) : null}
                </span>
                <span className="font-semibold text-slate-800 dark:text-zinc-200">
                  {slice.percent}%
                </span>
              </div>
              <div className="h-1 overflow-hidden rounded-full bg-slate-200 dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full ${
                    slice.isHighCpm
                      ? trafficBarClass("good")
                      : "bg-slate-400 dark:bg-zinc-500"
                  }`}
                  style={{ width: `${slice.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
