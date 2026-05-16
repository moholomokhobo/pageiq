import type { PageResult } from "@/app/dashboard/page-search-bar";
import type {
  DiscoverCategory,
  DiscoverContentType,
  TrendingPage,
} from "@/lib/discover-data";

function discoverAvatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff&size=128&bold=true`;
}

function livePageId(searchQuery: string) {
  return `live-${searchQuery
    .trim()
    .toLowerCase()
    .replace(/^@/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}`;
}

function mapPostTypeToContentType(type: string): DiscoverContentType {
  switch (type.toLowerCase()) {
    case "reel":
      return "Reels";
    case "video":
      return "Video";
    case "image":
      return "Images";
    default:
      return "Text";
  }
}

export function inferCategoryFromPageName(pageName: string): DiscoverCategory {
  const name = pageName.toLowerCase();
  if (/news|times|post|cnn|bbc/.test(name)) return "News";
  if (/sport|fc|nba|nfl|espn/.test(name)) return "Sports";
  if (/food|recipe|kitchen|tasty/.test(name)) return "Food";
  if (/tech|ai|software|apple|google/.test(name)) return "Technology";
  if (/fashion|vogue|style/.test(name)) return "Fashion";
  if (/business|finance|forbes/.test(name)) return "Business";
  return "Entertainment";
}

export function pageResultToTrendingPage(
  result: PageResult,
  searchQuery: string
): TrendingPage {
  const topPost = result.outlierPosts[0];
  const contentType = topPost
    ? mapPostTypeToContentType(topPost.type)
    : "Video";

  const preview =
    topPost?.preview?.trim() ||
    result.about?.trim().slice(0, 220) ||
    "Recent posts are being analyzed for this page.";

  return {
    id: livePageId(searchQuery),
    pageName: result.pageName,
    category: inferCategoryFromPageName(result.pageName),
    country: result.homeCountry ?? "Not listed",
    contentType,
    timePeriod: "Today",
    followerCount: result.followerCount,
    engagementRate: result.engagementRate,
    topPostPreview: preview,
    monthlyEarnings: result.monetization.monthlyEarningsRange,
    searchQuery: searchQuery.trim(),
    profilePictureUrl: result.profilePictureUrl ?? discoverAvatar(result.pageName),
    source: "live",
    monetization: result.monetization,
    topPostMultiplier: topPost?.multiplier,
  };
}
