"use client";

import {
  OVERVIEW_TIME_PERIODS,
  type OverviewTimePeriod,
} from "@/lib/overview-data";

const selectClass =
  "appearance-none rounded-md border border-slate-200 bg-white py-0.5 pl-2 pr-6 text-[10px] font-medium text-slate-600 shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/25 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-300 dark:focus:border-blue-400";

type SectionTimePeriodSelectProps = {
  value: OverviewTimePeriod;
  onChange: (value: OverviewTimePeriod) => void;
  id: string;
};

export function SectionTimePeriodSelect({
  value,
  onChange,
  id,
}: SectionTimePeriodSelectProps) {
  return (
    <div className="relative shrink-0">
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as OverviewTimePeriod)}
        className={selectClass}
        aria-label="Time period"
      >
        {OVERVIEW_TIME_PERIODS.map((period) => (
          <option key={period} value={period}>
            {period}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-1.5 text-slate-400 dark:text-zinc-500">
        <svg
          className="h-3 w-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </span>
    </div>
  );
}
