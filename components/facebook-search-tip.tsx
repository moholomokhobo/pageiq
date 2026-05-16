import { FACEBOOK_PAGE_SEARCH_TIP } from "@/lib/facebook-search-copy";

export function FacebookSearchTip({ className = "" }: { className?: string }) {
  return (
    <p
      className={`text-[11px] leading-snug text-slate-500 dark:text-zinc-400 ${className}`}
    >
      {FACEBOOK_PAGE_SEARCH_TIP}
    </p>
  );
}
