import type { MonetizationIntel } from "@/lib/cpm-intelligence";

export const DISCOVER_COUNTRIES = [
  "Global",
  "South Africa",
  "USA",
  "UK",
  "Nigeria",
  "Kenya",
] as const;

export const DISCOVER_CATEGORIES = [
  "Entertainment",
  "News",
  "Sports",
  "Business",
  "Food",
  "Fashion",
  "Technology",
  "Religion",
  "Politics",
] as const;

export const DISCOVER_CONTENT_TYPES = [
  "Reels",
  "Images",
  "Text",
  "Video",
] as const;

export const DISCOVER_TIME_PERIODS = [
  "Today",
  "This Week",
  "This Month",
] as const;

export type DiscoverCountry = (typeof DISCOVER_COUNTRIES)[number];
export type DiscoverCategory = (typeof DISCOVER_CATEGORIES)[number];
export type DiscoverContentType = (typeof DISCOVER_CONTENT_TYPES)[number];
export type DiscoverTimePeriod = (typeof DISCOVER_TIME_PERIODS)[number];

export type TrendingPageSource = "curated" | "live";

export type TrendingPage = {
  id: string;
  pageName: string;
  category: DiscoverCategory;
  /** Display label — use "Not listed" when country is unknown on live pages */
  country: string;
  contentType: DiscoverContentType;
  timePeriod: DiscoverTimePeriod;
  followerCount: string;
  engagementRate: string;
  topPostPreview: string;
  monthlyEarnings: string;
  searchQuery: string;
  profilePictureUrl: string;
  trendingRank?: number;
  /** Defaults to curated when omitted */
  source?: TrendingPageSource;
  /** Present on live pages from Apify */
  monetization?: MonetizationIntel;
  topPostMultiplier?: string;
  /** True when search API returned pages_database cache (< 24h) */
  fromCache?: boolean;
};

function avatar(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1d4ed8&color=fff&size=128&bold=true`;
}

export const trendingPages: TrendingPage[] = [
  {
    id: "tasty",
    pageName: "Tasty",
    category: "Food",
    country: "USA",
    contentType: "Reels",
    timePeriod: "Today",
    followerCount: "98.7M",
    engagementRate: "5.1%",
    topPostPreview:
      "60-second ramen hack that hit 12M views overnight — comments asking for the full recipe.",
    monthlyEarnings: "$42K – $68K",
    searchQuery: "tasty",
    profilePictureUrl: avatar("Tasty"),
    trendingRank: 1,
  },
  {
    id: "dstv",
    pageName: "DStv",
    category: "Entertainment",
    country: "South Africa",
    contentType: "Video",
    timePeriod: "This Week",
    followerCount: "2.4M",
    engagementRate: "4.8%",
    topPostPreview:
      "Finale clip thread driving 3× normal shares — fans tagging friends to watch live.",
    monthlyEarnings: "$8K – $14K",
    searchQuery: "DStv",
    profilePictureUrl: avatar("DStv"),
    trendingRank: 2,
  },
  {
    id: "bbc-africa",
    pageName: "BBC News Africa",
    category: "News",
    country: "Kenya",
    contentType: "Text",
    timePeriod: "Today",
    followerCount: "6.8M",
    engagementRate: "2.4%",
    topPostPreview:
      "Breaking election explainer post — 8.2K shares in 6 hours across East Africa.",
    monthlyEarnings: "$11K – $19K",
    searchQuery: "BBC News Africa",
    profilePictureUrl: avatar("BBC Africa"),
    trendingRank: 3,
  },
  {
    id: "burna",
    pageName: "Burna Boy",
    category: "Entertainment",
    country: "Nigeria",
    contentType: "Reels",
    timePeriod: "This Week",
    followerCount: "5.2M",
    engagementRate: "6.2%",
    topPostPreview:
      "Studio snippet reel — 2.1M plays, merch link clicks up 340% vs last week.",
    monthlyEarnings: "$28K – $45K",
    searchQuery: "Burna Boy",
    profilePictureUrl: avatar("Burna Boy"),
  },
  {
    id: "espn",
    pageName: "ESPN",
    category: "Sports",
    country: "USA",
    contentType: "Video",
    timePeriod: "Today",
    followerCount: "45.2M",
    engagementRate: "3.2%",
    topPostPreview:
      "Playoff highlight package — debate in comments boosting watch-time on follow-ups.",
    monthlyEarnings: "$55K – $82K",
    searchQuery: "ESPN",
    profilePictureUrl: avatar("ESPN"),
  },
  {
    id: "chelsea",
    pageName: "Chelsea FC",
    category: "Sports",
    country: "UK",
    contentType: "Images",
    timePeriod: "This Week",
    followerCount: "52.1M",
    engagementRate: "2.9%",
    topPostPreview:
      "Match-day carousel — jersey drop teaser with 180K saves on the album.",
    monthlyEarnings: "$38K – $61K",
    searchQuery: "Chelsea FC",
    profilePictureUrl: avatar("Chelsea"),
  },
  {
    id: "shoprite",
    pageName: "Shoprite SA",
    category: "Business",
    country: "South Africa",
    contentType: "Images",
    timePeriod: "This Month",
    followerCount: "890K",
    engagementRate: "3.6%",
    topPostPreview:
      "Weekly specials grid — UGC reposts from customers showing hauls in-store.",
    monthlyEarnings: "$3K – $6K",
    searchQuery: "Shoprite",
    profilePictureUrl: avatar("Shoprite"),
  },
  {
    id: "cnn",
    pageName: "CNN",
    category: "News",
    country: "USA",
    contentType: "Video",
    timePeriod: "Today",
    followerCount: "32.1M",
    engagementRate: "1.9%",
    topPostPreview:
      "Live briefing clip — cross-posted to 4 sister pages, comment velocity still rising.",
    monthlyEarnings: "$31K – $48K",
    searchQuery: "CNN",
    profilePictureUrl: avatar("CNN"),
  },
  {
    id: "vogue",
    pageName: "Vogue",
    category: "Fashion",
    country: "UK",
    contentType: "Images",
    timePeriod: "This Week",
    followerCount: "9.8M",
    engagementRate: "2.3%",
    topPostPreview:
      "Front-row reel stills — designers tagged, saves 4× page average on lookbook post.",
    monthlyEarnings: "$14K – $22K",
    searchQuery: "Vogue",
    profilePictureUrl: avatar("Vogue"),
  },
  {
    id: "apple",
    pageName: "Apple",
    category: "Technology",
    country: "USA",
    contentType: "Video",
    timePeriod: "This Month",
    followerCount: "14.2M",
    engagementRate: "1.8%",
    topPostPreview:
      "Product film cutdown — silent hype post, link-out CTR highest since last launch.",
    monthlyEarnings: "$24K – $36K",
    searchQuery: "Apple",
    profilePictureUrl: avatar("Apple"),
  },
  {
    id: "lakewood",
    pageName: "Lakewood Church",
    category: "Religion",
    country: "USA",
    contentType: "Video",
    timePeriod: "This Week",
    followerCount: "4.6M",
    engagementRate: "4.1%",
    topPostPreview:
      "Sunday message excerpt — prayer requests flooding comments, shares among groups.",
    monthlyEarnings: "$9K – $15K",
    searchQuery: "Lakewood Church",
    profilePictureUrl: avatar("Lakewood"),
  },
  {
    id: "econef",
    pageName: "Economic Freedom Fighters",
    category: "Politics",
    country: "South Africa",
    contentType: "Text",
    timePeriod: "Today",
    followerCount: "1.2M",
    engagementRate: "5.4%",
    topPostPreview:
      "Policy thread on cost of living — quote-tweets spiking among 25–34 demographic.",
    monthlyEarnings: "$4K – $8K",
    searchQuery: "EFF South Africa",
    profilePictureUrl: avatar("EFF"),
  },
  {
    id: "pulse-ng",
    pageName: "Pulse Nigeria",
    category: "Entertainment",
    country: "Nigeria",
    contentType: "Reels",
    timePeriod: "Today",
    followerCount: "3.8M",
    engagementRate: "4.9%",
    topPostPreview:
      "Afrobeats backstage reel — artist duet stitch chain still trending 48h later.",
    monthlyEarnings: "$12K – $20K",
    searchQuery: "Pulse Nigeria",
    profilePictureUrl: avatar("Pulse NG"),
  },
  {
    id: "nation-ke",
    pageName: "Nation Kenya",
    category: "News",
    country: "Kenya",
    contentType: "Text",
    timePeriod: "This Week",
    followerCount: "2.1M",
    engagementRate: "2.8%",
    topPostPreview:
      "Investigative teaser series — readers subscribing to page notifications for part 2.",
    monthlyEarnings: "$5K – $9K",
    searchQuery: "Nation Kenya",
    profilePictureUrl: avatar("Nation"),
  },
  {
    id: "forbes",
    pageName: "Forbes",
    category: "Business",
    country: "USA",
    contentType: "Images",
    timePeriod: "This Month",
    followerCount: "6.2M",
    engagementRate: "2.3%",
    topPostPreview:
      "30 Under 30 carousel — founders resharing with fundraising CTAs in comments.",
    monthlyEarnings: "$10K – $16K",
    searchQuery: "Forbes",
    profilePictureUrl: avatar("Forbes"),
  },
  {
    id: "nike",
    pageName: "Nike",
    category: "Fashion",
    country: "USA",
    contentType: "Reels",
    timePeriod: "This Week",
    followerCount: "39.5M",
    engagementRate: "2.0%",
    topPostPreview:
      "Athlete collab reel — UGC duet challenge, 890K uses of branded audio.",
    monthlyEarnings: "$48K – $74K",
    searchQuery: "nike",
    profilePictureUrl: avatar("Nike"),
  },
  {
    id: "mrbeast",
    pageName: "MrBeast",
    category: "Entertainment",
    country: "USA",
    contentType: "Video",
    timePeriod: "Today",
    followerCount: "22.4M",
    engagementRate: "5.8%",
    topPostPreview:
      "Giveaway teaser — notification opt-ins up 12%, comment rate highest this quarter.",
    monthlyEarnings: "$120K – $185K",
    searchQuery: "MrBeast",
    profilePictureUrl: avatar("MrBeast"),
    trendingRank: 1,
  },
  {
    id: "standard-uk",
    pageName: "Evening Standard",
    category: "News",
    country: "UK",
    contentType: "Text",
    timePeriod: "Today",
    followerCount: "1.8M",
    engagementRate: "2.1%",
    topPostPreview:
      "Commute-hour news digest — push notification clicks doubled vs yesterday.",
    monthlyEarnings: "$4K – $7K",
    searchQuery: "Evening Standard",
    profilePictureUrl: avatar("Standard"),
  },
  {
    id: "mtn-ng",
    pageName: "MTN Nigeria",
    category: "Technology",
    country: "Nigeria",
    contentType: "Images",
    timePeriod: "This Month",
    followerCount: "4.2M",
    engagementRate: "3.1%",
    topPostPreview:
      "Data bundle promo creative — redemption codes shared in WhatsApp groups.",
    monthlyEarnings: "$15K – $24K",
    searchQuery: "MTN Nigeria",
    profilePictureUrl: avatar("MTN"),
  },
  {
    id: "woolworths",
    pageName: "Woolworths SA",
    category: "Food",
    country: "South Africa",
    contentType: "Reels",
    timePeriod: "This Week",
    followerCount: "620K",
    engagementRate: "4.2%",
    topPostPreview:
      "Meal-prep reel with local ingredients — saves up, in-store footfall promo code used 2.4K×.",
    monthlyEarnings: "$2K – $5K",
    searchQuery: "Woolworths SA",
    profilePictureUrl: avatar("Woolworths"),
  },
  {
    id: "man-city",
    pageName: "Manchester City",
    category: "Sports",
    country: "UK",
    contentType: "Video",
    timePeriod: "Today",
    followerCount: "28.6M",
    engagementRate: "3.4%",
    topPostPreview:
      "Training cam mic'd up clip — international fan pages re-uploading with translations.",
    monthlyEarnings: "$29K – $46K",
    searchQuery: "Manchester City",
    profilePictureUrl: avatar("Man City"),
  },
  {
    id: "pastor-alpha",
    pageName: "Pastor Alph Lukau",
    category: "Religion",
    country: "South Africa",
    contentType: "Video",
    timePeriod: "This Week",
    followerCount: "3.1M",
    engagementRate: "5.9%",
    topPostPreview:
      "Testimony highlight reel — share count 5× average, weekend service stream signups up.",
    monthlyEarnings: "$18K – $28K",
    searchQuery: "Pastor Alph Lukau",
    profilePictureUrl: avatar("ALFC"),
  },
  {
    id: "labour-uk",
    pageName: "Labour Party",
    category: "Politics",
    country: "UK",
    contentType: "Text",
    timePeriod: "This Month",
    followerCount: "1.1M",
    engagementRate: "3.8%",
    topPostPreview:
      "Manifesto bullet thread — young voter cohort engaging with poll in comments.",
    monthlyEarnings: "$3K – $6K",
    searchQuery: "Labour Party UK",
    profilePictureUrl: avatar("Labour"),
  },
  {
    id: "samsung",
    pageName: "Samsung",
    category: "Technology",
    country: "Kenya",
    contentType: "Images",
    timePeriod: "This Week",
    followerCount: "1.4M",
    engagementRate: "2.6%",
    topPostPreview:
      "Galaxy launch carousel — retailer partners co-posting, regional pre-order spike.",
    monthlyEarnings: "$6K – $11K",
    searchQuery: "Samsung Kenya",
    profilePictureUrl: avatar("Samsung"),
  },
  {
    id: "netflix",
    pageName: "Netflix",
    category: "Entertainment",
    country: "USA",
    contentType: "Reels",
    timePeriod: "This Month",
    followerCount: "92.5M",
    engagementRate: "2.4%",
    topPostPreview:
      "Series cliffhanger reel — spoiler-marked discussion thread still growing day 3.",
    monthlyEarnings: "$52K – $78K",
    searchQuery: "Netflix",
    profilePictureUrl: avatar("Netflix"),
  },
];

export function filterTrendingPages(
  pages: TrendingPage[],
  filters: {
    country: DiscoverCountry;
    category: DiscoverCategory | "All";
    contentType: DiscoverContentType | "All";
    timePeriod: DiscoverTimePeriod;
  }
): TrendingPage[] {
  return pages.filter((page) => {
    if (filters.country !== "Global" && page.country !== filters.country) {
      return false;
    }
    if (filters.category !== "All" && page.category !== filters.category) {
      return false;
    }
    if (
      filters.contentType !== "All" &&
      page.contentType !== filters.contentType
    ) {
      return false;
    }
    if (page.timePeriod !== filters.timePeriod) {
      return false;
    }
    return true;
  });
}

/** @deprecated Use trendingPages — kept for any legacy imports */
export const discoverCategories = [];
