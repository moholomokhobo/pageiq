import {
  getEarningPotentialFromPage,
  type EarningPotentialFilter,
} from "@/lib/earning-potential";
import type { PageListItem } from "@/lib/pages-list-data";

export type TriStateFilter = "all" | "yes" | "no";

export type PageAdvancedFilters = {
  earningPotential: EarningPotentialFilter;
  monetization: "all" | "on" | "off";
  hasReels: TriStateFilter;
  aiPage: TriStateFilter;
  kidsContent: TriStateFilter;
  facelessPage: TriStateFilter;
  followersRange: string;
  avgViewsRange: string;
  daysSinceStartRange: string;
  postsRange: string;
};

export const DEFAULT_PAGE_ADVANCED_FILTERS: PageAdvancedFilters = {
  earningPotential: "all",
  monetization: "all",
  hasReels: "all",
  aiPage: "all",
  kidsContent: "all",
  facelessPage: "all",
  followersRange: "any",
  avgViewsRange: "any",
  daysSinceStartRange: "any",
  postsRange: "any",
};

export const FOLLOWERS_RANGE_OPTIONS = [
  { value: "any", label: "Any followers" },
  { value: "0-10000", label: "Under 10K" },
  { value: "10000-100000", label: "10K – 100K" },
  { value: "100000-1000000", label: "100K – 1M" },
  { value: "1000000+", label: "1M+" },
] as const;

export const AVG_VIEWS_RANGE_OPTIONS = [
  { value: "any", label: "Any avg views" },
  { value: "0-10000", label: "Under 10K" },
  { value: "10000-50000", label: "10K – 50K" },
  { value: "50000-100000", label: "50K – 100K" },
  { value: "100000+", label: "100K+" },
] as const;

export const DAYS_RANGE_OPTIONS = [
  { value: "any", label: "Any age" },
  { value: "0-90", label: "Under 90 days" },
  { value: "90-365", label: "90 days – 1 year" },
  { value: "365-730", label: "1 – 2 years" },
  { value: "730+", label: "2+ years" },
] as const;

export const EARNING_POTENTIAL_FILTER_OPTIONS = [
  { value: "all", label: "All" },
  { value: "high", label: "High Potential" },
  { value: "growing", label: "Growing" },
  { value: "early", label: "Early Stage" },
] as const;

export const POSTS_RANGE_OPTIONS = [
  { value: "any", label: "Any post count" },
  { value: "0-50", label: "Under 50" },
  { value: "50-200", label: "50 – 200" },
  { value: "200-500", label: "200 – 500" },
  { value: "500+", label: "500+" },
] as const;

function hashSeed(id: string) {
  return id.split("").reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function matchesTriState(
  value: boolean,
  filter: TriStateFilter
): boolean {
  if (filter === "all") return true;
  return filter === "yes" ? value : !value;
}

function matchesNumericRange(value: number, range: string): boolean {
  if (range === "any") return true;
  if (range.endsWith("+")) {
    const min = Number(range.replace("+", ""));
    return value >= min;
  }
  const [minStr, maxStr] = range.split("-");
  const min = Number(minStr);
  const max = Number(maxStr);
  if (Number.isNaN(min) || Number.isNaN(max)) return true;
  return value >= min && value <= max;
}

export function pageHasReels(page: PageListItem): boolean {
  return page.popularPosts.some((post) => /\d+:\d{2}/.test(post.overlayLabel));
}

export function pageIsAiPage(page: PageListItem): boolean {
  const haystack = `${page.pageName} ${page.niche}`.toLowerCase();
  return (
    /\bai\b|artificial|automation|generated|gpt|bot\b/.test(haystack) ||
    hashSeed(page.id) % 11 === 0
  );
}

export function pageIsKidsContent(page: PageListItem): boolean {
  const haystack = `${page.pageName} ${page.niche}`.toLowerCase();
  return /kid|children|family|toy|nursery|baby|parenting|cartoon/.test(haystack);
}

export function pageIsFaceless(page: PageListItem): boolean {
  const haystack = `${page.pageName} ${page.niche}`.toLowerCase();
  return (
    /faceless|anonymous|story|facts|motivation|quotes|finance tips/.test(
      haystack
    ) || hashSeed(page.id) % 6 === 2
  );
}

export function applyAdvancedFilters(
  pages: PageListItem[],
  filters: PageAdvancedFilters
): PageListItem[] {
  return pages.filter((page) => {
    if (filters.earningPotential !== "all") {
      const { tier } = getEarningPotentialFromPage(page);
      if (tier !== filters.earningPotential) return false;
    }

    if (filters.monetization === "on" && !page.monetized) return false;
    if (filters.monetization === "off" && page.monetized) return false;

    if (!matchesTriState(pageHasReels(page), filters.hasReels)) return false;
    if (!matchesTriState(pageIsAiPage(page), filters.aiPage)) return false;
    if (!matchesTriState(pageIsKidsContent(page), filters.kidsContent))
      return false;
    if (!matchesTriState(pageIsFaceless(page), filters.facelessPage))
      return false;

    if (!matchesNumericRange(page.followersRaw, filters.followersRange))
      return false;
    if (!matchesNumericRange(page.avgViewsPerReelRaw, filters.avgViewsRange))
      return false;
    if (!matchesNumericRange(page.daysSinceStart, filters.daysSinceStartRange))
      return false;
    if (!matchesNumericRange(page.numberOfPosts, filters.postsRange))
      return false;

    return true;
  });
}

export function countActiveAdvancedFilters(filters: PageAdvancedFilters): number {
  let count = 0;
  if (filters.earningPotential !== "all") count += 1;
  if (filters.monetization !== "all") count += 1;
  if (filters.hasReels !== "all") count += 1;
  if (filters.aiPage !== "all") count += 1;
  if (filters.kidsContent !== "all") count += 1;
  if (filters.facelessPage !== "all") count += 1;
  if (filters.followersRange !== "any") count += 1;
  if (filters.avgViewsRange !== "any") count += 1;
  if (filters.daysSinceStartRange !== "any") count += 1;
  if (filters.postsRange !== "any") count += 1;
  return count;
}
