import { DISCOVER_CATEGORIES, trendingPages } from "@/lib/discover-data";

export const OVERVIEW_STATS = {
  totalPagesAnalyzed: 2_847_293,
  addedToday: 1_240,
};

export const OVERVIEW_TIME_PERIODS = [
  "Last 7 Days",
  "Last 14 Days",
  "Last 30 Days",
  "Last 6 Months",
] as const;

export type OverviewTimePeriod = (typeof OVERVIEW_TIME_PERIODS)[number];

export type RecentOutlierRow = {
  id: string;
  pageName: string;
  followerCount: string;
  multiplier: number;
  profilePictureUrl: string;
  searchQuery: string;
};

export type HighCompetitionRow = {
  id: string;
  pageName: string;
  niche: string;
  followerCount: string;
  avgViews: string;
  uploadsCount: number;
  outlierScore: number;
  profilePictureUrl: string;
  searchQuery: string;
};

export type TrendingTopic = {
  id: string;
  topic: string;
  engagementLift: number;
  postVolume: string;
};

export type PopularCategory = {
  id: string;
  name: string;
  pageCount: number;
  sharePercent: number;
  engagementLift: number;
};

export type TrendingHashtag = {
  id: string;
  tag: string;
  postCount: string;
  increasePercent: number;
  momentum: number;
};

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff&size=128&bold=true`;
}

export const recentOutlierPages: RecentOutlierRow[] = [
  {
    id: "ro-1",
    pageName: "Viral Recipe Lab",
    followerCount: "84.2K",
    multiplier: 7.14,
    profilePictureUrl: avatar("Viral Recipe Lab"),
    searchQuery: "Viral Recipe Lab",
  },
  {
    id: "ro-2",
    pageName: "Startup Grind Africa",
    followerCount: "312K",
    multiplier: 6.42,
    profilePictureUrl: avatar("Startup Grind"),
    searchQuery: "Startup Grind Africa",
  },
  {
    id: "ro-3",
    pageName: "Mom Hacks Daily",
    followerCount: "1.1M",
    multiplier: 5.88,
    profilePictureUrl: avatar("Mom Hacks"),
    searchQuery: "Mom Hacks Daily",
  },
  {
    id: "ro-4",
    pageName: "TechPulse NG",
    followerCount: "428K",
    multiplier: 5.31,
    profilePictureUrl: avatar("TechPulse"),
    searchQuery: "TechPulse NG",
  },
  {
    id: "ro-5",
    pageName: "FitFuel Reels",
    followerCount: "156K",
    multiplier: 4.97,
    profilePictureUrl: avatar("FitFuel"),
    searchQuery: "FitFuel Reels",
  },
  {
    id: "ro-6",
    pageName: "Budget Travel SA",
    followerCount: "92K",
    multiplier: 4.62,
    profilePictureUrl: avatar("Budget Travel"),
    searchQuery: "Budget Travel SA",
  },
];

export const highCompetitionPages: HighCompetitionRow[] = [
  {
    id: "hc-1",
    pageName: "Tasty",
    niche: "Food & recipes",
    followerCount: "98.7M",
    avgViews: "1.2M",
    uploadsCount: 48,
    outlierScore: 94,
    profilePictureUrl: avatar("Tasty"),
    searchQuery: "tasty",
  },
  {
    id: "hc-2",
    pageName: "ESPN",
    niche: "Sports",
    followerCount: "45.2M",
    avgViews: "890K",
    uploadsCount: 62,
    outlierScore: 91,
    profilePictureUrl: avatar("ESPN"),
    searchQuery: "ESPN",
  },
  {
    id: "hc-3",
    pageName: "Netflix",
    niche: "Entertainment",
    followerCount: "92.5M",
    avgViews: "2.4M",
    uploadsCount: 36,
    outlierScore: 93,
    profilePictureUrl: avatar("Netflix"),
    searchQuery: "Netflix",
  },
  {
    id: "hc-4",
    pageName: "BBC News Africa",
    niche: "News",
    followerCount: "6.8M",
    avgViews: "420K",
    uploadsCount: 41,
    outlierScore: 86,
    profilePictureUrl: avatar("BBC Africa"),
    searchQuery: "BBC News Africa",
  },
  {
    id: "hc-5",
    pageName: "Burna Boy",
    niche: "Music",
    followerCount: "5.2M",
    avgViews: "680K",
    uploadsCount: 28,
    outlierScore: 88,
    profilePictureUrl: avatar("Burna Boy"),
    searchQuery: "Burna Boy",
  },
  {
    id: "hc-6",
    pageName: "DStv",
    niche: "Entertainment",
    followerCount: "2.4M",
    avgViews: "310K",
    uploadsCount: 34,
    outlierScore: 85,
    profilePictureUrl: avatar("DStv"),
    searchQuery: "DStv",
  },
];

export const trendingTopics: TrendingTopic[] = [
  { id: "tt-1", topic: "AI side hustles", engagementLift: 142, postVolume: "12.4K posts" },
  { id: "tt-2", topic: "30-day fitness challenges", engagementLift: 118, postVolume: "9.8K posts" },
  { id: "tt-3", topic: "Budget meal prep", engagementLift: 96, postVolume: "18.2K posts" },
  { id: "tt-4", topic: "Local news explainers", engagementLift: 87, postVolume: "6.1K posts" },
  { id: "tt-5", topic: "Reels hooks & scripts", engagementLift: 79, postVolume: "14.7K posts" },
  { id: "tt-6", topic: "Small business tax tips", engagementLift: 71, postVolume: "5.3K posts" },
];

export const trendingHashtags: TrendingHashtag[] = [
  { id: "th-1", tag: "#reels", postCount: "2.4M posts", increasePercent: 84, momentum: 92 },
  { id: "th-2", tag: "#facebookmarketing", postCount: "890K posts", increasePercent: 67, momentum: 78 },
  { id: "th-3", tag: "#smallbusiness", postCount: "1.1M posts", increasePercent: 54, momentum: 71 },
  { id: "th-4", tag: "#viral", postCount: "3.2M posts", increasePercent: 48, momentum: 65 },
  { id: "th-5", tag: "#motivation", postCount: "1.8M posts", increasePercent: 41, momentum: 58 },
  { id: "th-6", tag: "#recipe", postCount: "960K posts", increasePercent: 38, momentum: 52 },
];

export const popularCategories: PopularCategory[] = DISCOVER_CATEGORIES.map(
  (name, index) => ({
    id: `cat-${index}`,
    name,
    pageCount: Math.round(180 + (index * 47) % 320),
    sharePercent: Math.round(22 - index * 1.8),
    engagementLift: Math.round(34 + (index * 11) % 55),
  })
).sort((a, b) => b.pageCount - a.pageCount);

/** Filter overview lists by keyword across common text fields */
export function filterOverviewRows<T extends Record<string, unknown>>(
  rows: T[],
  keyword: string,
  fields: (keyof T)[]
): T[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter((row) => {
    const haystack = fields
      .map((field) => String(row[field] ?? ""))
      .join(" ")
      .toLowerCase();
    return haystack.includes(q);
  });
}

export type OpportunityRadarItem = {
  id: string;
  label: string;
  score: number;
  signal: string;
};

export type NicheSaturationItem = {
  id: string;
  niche: string;
  saturationPercent: number;
  label: string;
};

export type RisingStarItem = {
  id: string;
  pageName: string;
  growthPercent: number;
  followerCount: string;
  profilePictureUrl: string;
  searchQuery: string;
};

export const opportunityRadarItems: OpportunityRadarItem[] = [
  { id: "or-1", label: "Faith-based short reels", score: 92, signal: "Low saturation" },
  { id: "or-2", label: "Local service business tips", score: 88, signal: "Rising demand" },
  { id: "or-3", label: "AI productivity carousels", score: 84, signal: "High CPM niche" },
  { id: "or-4", label: "Budget travel day trips", score: 79, signal: "Underserved region" },
];

export const nicheSaturationItems: NicheSaturationItem[] = [
  { id: "ns-1", niche: "Food & recipes", saturationPercent: 91, label: "Saturated" },
  { id: "ns-2", niche: "Fitness challenges", saturationPercent: 84, label: "High" },
  { id: "ns-3", niche: "Small business tips", saturationPercent: 62, label: "Moderate" },
  { id: "ns-4", niche: "Faith & motivation", saturationPercent: 48, label: "Open" },
];

export const risingStarPages: RisingStarItem[] = [
  {
    id: "rs-1",
    pageName: "Cape Creators Hub",
    growthPercent: 214,
    followerCount: "48K",
    profilePictureUrl: avatar("Cape Creators"),
    searchQuery: "Cape Creators Hub",
  },
  {
    id: "rs-2",
    pageName: "Lagos Side Hustle",
    growthPercent: 187,
    followerCount: "92K",
    profilePictureUrl: avatar("Lagos Side Hustle"),
    searchQuery: "Lagos Side Hustle",
  },
  {
    id: "rs-3",
    pageName: "Reel Script Lab",
    growthPercent: 156,
    followerCount: "31K",
    profilePictureUrl: avatar("Reel Script Lab"),
    searchQuery: "Reel Script Lab",
  },
  {
    id: "rs-4",
    pageName: "Mompreneur Daily",
    growthPercent: 142,
    followerCount: "67K",
    profilePictureUrl: avatar("Mompreneur"),
    searchQuery: "Mompreneur Daily",
  },
];

export const browseSeedCount = trendingPages.length;
