import { isPostOutlier } from "@/lib/outlier-score";

export function HiddenGemBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r from-emerald-600 to-teal-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow ${className}`}
    >
      Hidden Gem
    </span>
  );
}

export function LiveDataBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-green-600/30 dark:bg-green-500 ${className}`}
    >
      Live Data
    </span>
  );
}

export function CachedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 ${className}`}
    >
      Cached
    </span>
  );
}

export function LiveBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full bg-green-600 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm shadow-green-600/30 dark:bg-green-500 ${className}`}
    >
      Live
    </span>
  );
}

export function DataSourceBadge({
  fromCache,
  className = "",
}: {
  fromCache?: boolean;
  className?: string;
}) {
  if (fromCache) {
    return <CachedBadge className={className} />;
  }
  return <LiveBadge className={className} />;
}

export function CuratedBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 ${className}`}
    >
      Curated
    </span>
  );
}

export function PostOutlierBadge({
  multiplier,
  className = "",
}: {
  multiplier: string;
  className?: string;
}) {
  if (!isPostOutlier(multiplier)) return null;

  return (
    <span
      className={`inline-flex shrink-0 items-center rounded-full bg-gradient-to-r from-violet-600 to-indigo-600 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white shadow ${className}`}
    >
      Outlier
    </span>
  );
}
