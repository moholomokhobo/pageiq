import { OUTLIER_SCORE_TOOLTIP } from "@/lib/outlier-score";

export function OutlierScoreLabel({
  className = "",
}: {
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span className="text-[10px] font-medium tracking-wide text-slate-500 dark:text-zinc-400">
        Outlier
      </span>
      <button
        type="button"
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
        title={OUTLIER_SCORE_TOOLTIP}
        aria-label={OUTLIER_SCORE_TOOLTIP}
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
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      </button>
    </span>
  );
}
