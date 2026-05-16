import type { MonetizationIntel } from "@/lib/cpm-intelligence";
import type { PopularPost } from "@/lib/pages-list-data";
import {
  calculateMonetizationIntel,
  inferContentTypeFromPostTypes,
} from "@/lib/cpm-intelligence";
import { calculateOutlierScore } from "@/lib/outlier-score";

export type PostType = "image" | "video" | "text" | "reel";

export type ScrapedPost = {
  preview: string;
  likes: number;
  comments: number;
  shares: number;
  type: PostType;
  totalEngagement: number;
  postedAt: string;
  postedAtDate: Date;
};

export type OutlierPostResult = {
  preview: string;
  likes: string;
  comments: string;
  shares: string;
  type: PostType;
  multiplier: string;
  totalEngagement: string;
  postedAt: string;
};

export type FacebookPageStats = {
  pageName: string;
  about: string;
  followerCount: string;
  engagementRate: string;
  postsLast30Days: number;
  postsThisMonth: number;
  postsToday: number;
  outlierScore: number;
  samplePostsAnalysis: boolean;
  profilePictureUrl?: string;
  /** Detected home country from page metadata; null when unknown */
  homeCountry: string | null;
  monetization: MonetizationIntel;
  outlierPosts: OutlierPostResult[];
  /** Latest feed posts for Pages list (from facebook-posts-scraper) */
  popularPosts?: PopularPost[];
  /** Estimated from scraped post engagement (likes × type multiplier) */
  estimatedAvgViewsPerReel?: number;
  estimatedAvgViewsPerImage?: number;
  estimatedAvgViewsPerText?: number;
  /** True when avg_views_reel is from Apify play counts on the Reels tab */
  usesRealReelViews?: boolean;
};

export function formatCount(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`;
  }
  return value.toLocaleString("en-US");
}

export function parseCountToken(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?$/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  const suffix = (match[2] ?? "").toUpperCase();
  if (suffix === "K") num *= 1_000;
  if (suffix === "M") num *= 1_000_000;
  if (suffix === "B") num *= 1_000_000_000;

  return Math.round(num);
}

export function extractFollowerCount(text: string): number {
  const patterns = [
    /([\d,.]+[KMB]?)\s+followers/i,
    /([\d,.]+[KMB]?)\s+likes/i,
    /([\d,.]+[KMB]?)\s+people like this/i,
    /([\d,.]+[KMB]?)\s+follow this/i,
    /"follower_count"\s*:\s*(\d+)/i,
    /"followers_count"\s*:\s*(\d+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const parsed = parseCountToken(match[1]);
      if (parsed > 0) return parsed;
    }
  }

  return 0;
}

function formatPostDate(date: Date): string {
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function isThisMonth(date: Date): boolean {
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
}

function countPostsThisMonth(posts: ScrapedPost[]): number {
  return posts.filter((post) => isThisMonth(post.postedAtDate)).length;
}

export function countPostsToday(posts: ScrapedPost[]): number {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  return posts.filter((post) => post.postedAtDate >= startOfToday).length;
}

type PageNiche =
  | "general"
  | "sports"
  | "news"
  | "fashion"
  | "tech"
  | "food"
  | "entertainment";

const NICHE_POST_TEMPLATES: Record<PageNiche, string[]> = {
  general: [
    "Behind the scenes of what we're building next — thoughts?",
    "Weekly roundup: what mattered most to our community this week.",
    "Quick poll: what should we cover in our next live session?",
    "Thank you for 10K interactions on our latest update!",
    "New launch day — swipe for the full breakdown.",
  ],
  sports: [
    "Full-time highlights are in — who was your MVP today?",
    "Training camp day 3: the energy in the locker room is unreal.",
    "Match preview: everything you need before kickoff.",
    "That winning moment had the whole stadium on their feet.",
    "Recovery, film study, and prep — how champions spend Sunday.",
  ],
  news: [
    "Breaking: here's what we know so far — story developing.",
    "Morning briefing: the five headlines you need today.",
    "Explainer: what this policy change means for you.",
    "On the ground reporting from today's press conference.",
    "Weekend read: the story everyone's talking about.",
  ],
  fashion: [
    "Spring drop lookbook — which fit is your favorite?",
    "Styling one piece three ways for day-to-night.",
    "Runway recap: the trends you'll actually wear.",
    "Restock alert: bestsellers are back in limited sizes.",
    "Get ready with us for tonight's event.",
  ],
  tech: [
    "We just shipped a feature you've been asking for — demo inside.",
    "Benchmark results are in: faster, leaner, and more reliable.",
    "Founder note: why we rebuilt our core architecture.",
    "Product tip Tuesday: 3 workflows to save an hour a day.",
    "Live Q&A recap — your top questions answered.",
  ],
  food: [
    "15-minute weeknight recipe our team can't stop making.",
    "New menu item taste test — honest reactions only.",
    "Farm-to-table spotlight: meet this week's supplier.",
    "Meal prep Sunday: full plan in the carousel.",
    "Secret menu hack you need to try on your next visit.",
  ],
  entertainment: [
    "Trailer drop — who else has chills?",
    "Episode 6 Easter eggs you probably missed.",
    "Tour diary: night three was absolutely electric.",
    "Cast interview: the scene that was hardest to film.",
    "Fan art Friday — your creations blew us away.",
  ],
};

const POST_TYPES: PostType[] = ["image", "video", "text", "reel"];

const ENGAGEMENT_PROFILES = [
  0.32, 0.41, 0.48, 0.57, 0.66, 0.74, 0.82, 0.91, 1.0, 1.08, 1.16, 1.28,
  1.42, 1.58, 1.72, 2.05, 3.35, 4.15, 5.25, 6.4,
];

export function hashString(value: string): number {
  return value.split("").reduce((h, c) => (Math.imul(31, h) + c.charCodeAt(0)) | 0, 0);
}

export function createSeededRandom(seed: string) {
  let state = Math.abs(hashString(seed)) || 1;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

export function extractAbout(bodyText: string, metaDescription = ""): string {
  const aboutMatch = bodyText.match(
    /(?:^|\n)About\s*\n+([\s\S]{12,260}?)(?:\n{2,}|\n(?:Follow|Message|Photos|Videos|Reels|Posts))/i
  );
  if (aboutMatch?.[1]) {
    return aboutMatch[1].trim().replace(/\s+/g, " ");
  }
  if (metaDescription.trim()) {
    return metaDescription.trim();
  }
  return "";
}

export function detectPageNiche(pageName: string, about: string): PageNiche {
  const text = `${pageName} ${about}`.toLowerCase();

  if (/sport|football|soccer|nba|nfl|fifa|athlete|fitness|gym|nike|adidas|espn/.test(text)) {
    return "sports";
  }
  if (/news|bbc|cnn|times|herald|daily|media|journal|politics|world/.test(text)) {
    return "news";
  }
  if (/fashion|beauty|style|wear|boutique|vogue|apparel|luxury/.test(text)) {
    return "fashion";
  }
  if (/tech|software|ai|startup|digital|cloud|developer|saas|meta|apple|google/.test(text)) {
    return "tech";
  }
  if (/food|recipe|restaurant|kitchen|chef|bake|cafe|dining|eat/.test(text)) {
    return "food";
  }
  if (/music|film|movie|show|entertainment|concert|tv|streaming|netflix|game/.test(text)) {
    return "entertainment";
  }

  return "general";
}

function pickPostType(rand: () => number, index: number): PostType {
  if (index % 5 === 4) return "reel";
  if (index % 4 === 2) return "video";
  if (index % 3 === 0) return "image";
  return POST_TYPES[Math.floor(rand() * POST_TYPES.length)];
}

export function generateMockPosts(
  pageName: string,
  followers: number,
  about: string
): ScrapedPost[] {
  const niche = detectPageNiche(pageName, about);
  const templates = NICHE_POST_TEMPLATES[niche];
  const rand = createSeededRandom(`${pageName}-${followers}-${niche}`);
  const baseLikes = Math.round(
    Math.max(180, followers * 0.0018) * (0.88 + rand() * 0.35)
  );

  const posts: ScrapedPost[] = [];

  for (let i = 0; i < 20; i++) {
    const profile = ENGAGEMENT_PROFILES[i];
    const variance = 0.92 + rand() * 0.22;
    const likes = Math.round(baseLikes * profile * variance);
    const comments = Math.round(likes * (0.018 + rand() * 0.065));
    const shares = Math.round(likes * (0.008 + rand() * 0.04));
    const totalEngagement = likes + comments + shares;

    const daysAgo = Math.floor(rand() * 29) + 1;
    const postedAtDate = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
    const template =
      templates[i % templates.length] ?? NICHE_POST_TEMPLATES.general[i % 5];
    const preview = template.replace("{page}", pageName);

    posts.push({
      preview,
      likes,
      comments,
      shares,
      type: pickPostType(rand, i),
      totalEngagement,
      postedAt: formatPostDate(postedAtDate),
      postedAtDate,
    });
  }

  return posts.sort((a, b) => b.postedAtDate.getTime() - a.postedAtDate.getTime());
}

export function calculateEngagementRate(
  followers: number,
  posts: ScrapedPost[]
): number {
  const engagements = posts
    .map((post) => post.totalEngagement)
    .filter((value) => value > 0);

  if (followers > 0 && engagements.length > 0) {
    const avg = engagements.reduce((sum, n) => sum + n, 0) / engagements.length;
    const rate = (avg / followers) * 100;
    return Math.min(15, Math.max(0.1, Number(rate.toFixed(1))));
  }

  const baseline = 1.2 + Math.log10(Math.max(followers, 1_000)) * 0.45;
  const activityBoost = Math.min(2.5, posts.length * 0.15);
  return Number(Math.min(12, baseline + activityBoost).toFixed(1));
}

export { calculateOutlierScore } from "@/lib/outlier-score";

export function findOutlierPosts(posts: ScrapedPost[]): OutlierPostResult[] {
  const withEngagement = posts.filter((post) => post.totalEngagement > 0);
  if (withEngagement.length === 0) return [];

  const average =
    withEngagement.reduce((sum, post) => sum + post.totalEngagement, 0) /
    withEngagement.length;
  const threshold = average * 3;

  return withEngagement
    .filter((post) => post.totalEngagement >= threshold)
    .map((post) => {
      const multiplierValue = post.totalEngagement / average;
      return {
        preview: post.preview,
        likes: formatCount(post.likes),
        comments: formatCount(post.comments),
        shares: formatCount(post.shares),
        type: post.type,
        multiplier: `${multiplierValue.toFixed(1)}x`,
        totalEngagement: formatCount(post.totalEngagement),
        postedAt: post.postedAt,
      };
    })
    .sort((a, b) => parseFloat(b.multiplier) - parseFloat(a.multiplier));
}

export function buildPageStatsFromPosts(
  pageName: string,
  about: string,
  followers: number,
  posts: ScrapedPost[],
  samplePostsAnalysis = false,
  profilePictureUrl?: string,
  homeCountry?: string
): FacebookPageStats {
  const engagementRate = calculateEngagementRate(followers, posts);
  const outlierPosts = findOutlierPosts(posts);
  const postsLast30Days = posts.length;
  const postsThisMonth = countPostsThisMonth(posts);
  const postsToday = countPostsToday(posts);
  const contentType = inferContentTypeFromPostTypes(posts.map((p) => p.type));
  const monetization = calculateMonetizationIntel({
    pageName,
    followerCount: followers,
    engagementRate,
    contentType,
    homeCountry,
    postsLast30Days,
  });
  const outlierScore = calculateOutlierScore(
    followers,
    engagementRate,
    monetization.monetizationScore,
    postsLast30Days
  );

  return {
    pageName,
    about,
    followerCount: followers > 0 ? formatCount(followers) : "N/A",
    engagementRate: `${engagementRate}%`,
    postsLast30Days,
    postsThisMonth,
    postsToday,
    outlierScore,
    samplePostsAnalysis,
    profilePictureUrl,
    homeCountry: homeCountry ?? null,
    monetization,
    outlierPosts,
  };
}

export function buildPageStats(
  pageName: string,
  about: string,
  followers: number
): FacebookPageStats {
  const posts = generateMockPosts(pageName, followers, about);
  return buildPageStatsFromPosts(pageName, about, followers, posts, true);
}

export function estimateFollowersFromName(pageName: string): number {
  const rand = createSeededRandom(pageName);
  const tier = Math.abs(hashString(pageName)) % 5;
  const bases = [8_500, 42_000, 185_000, 890_000, 2_400_000];
  return Math.round(bases[tier] * (0.75 + rand() * 0.6));
}
