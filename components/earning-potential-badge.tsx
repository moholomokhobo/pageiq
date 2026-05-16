import {
  EARNING_POTENTIAL_BADGE,
  EARNING_POTENTIAL_TOOLTIP,
  getEarningPotentialFromPage,
} from "@/lib/earning-potential";
import type { PageListItem } from "@/lib/pages-list-data";

export function EarningPotentialBadge({ page }: { page: PageListItem }) {
  const { tier } = getEarningPotentialFromPage(page);
  const badge = EARNING_POTENTIAL_BADGE[tier];

  return (
    <span
      className={`inline-flex max-w-full items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold leading-tight ${badge.className}`}
    >
      <span className="truncate">{badge.label}</span>
      <span
        className="shrink-0 cursor-help text-[11px] leading-none opacity-80"
        title={EARNING_POTENTIAL_TOOLTIP}
        aria-label={EARNING_POTENTIAL_TOOLTIP}
      >
        ⓘ
      </span>
    </span>
  );
}
