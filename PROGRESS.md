# PageIQ Progress

**Live:** [pageiq-five.vercel.app](https://pageiq-five.vercel.app)  
**GitHub:** [github.com/moholomokhobo/pageiq](https://github.com/moholomokhobo/pageiq)  
**Local:** `C:\Users\YK\Documents\PageIQ\pageiq`

## Completed

- Fixed all `motion.div` errors across the app (replaced with regular `div` elements; no framer-motion)
- **Pages** section working — NexLev-style layout, 6 stat boxes, most popular posts, sortable columns, filter tabs
- **Overview** redesigned — Opportunity Radar, Rising Stars, Trending Hashtags, Niche Saturation Index, time period dropdowns
- **Pages database** table created in Supabase (`public.pages_database`) with auto-upsert on search
- **Apify** scraping working and saving results to the database
- **URL search** recommended over name search — placeholder + tip on Dashboard, Pages, and Overview
- **Account** button with dropdown in top bar; Overview sidebar icon changed to house
- **Estimated views** from real Apify engagement data (reel / image / text multipliers)
- Hydration fixes (locale-safe number formatting on Pages stats)
- Explicit Supabase `public` schema for `pages_database` queries
- All main pages loading without errors
- Discover trending feed, Outlier score, CPM intelligence, Live Data / Curated badges, Hidden Gems
- Dashboard, Compare, Watchlist, AI Tools, dark/light mode
- **Database caching fully working** — `GET /api/search` serves from `pages_database` when `last_scraped_at` is under 24h (**315–862ms** cache hit vs **40–60s** Apify scrape)
- All `pages_database` columns fixed — profile picture, popular posts, monetization, engagement rate (numeric), outlier posts, and full scrape snapshot fields save and load correctly
- Cache hit returns **complete data** (same shape as live Apify); incomplete cache (e.g. missing profile URL) forces a fresh scrape and DB update
- Cached / Live badges on Dashboard, Pages, Discover, and Compare
- **Real data scraping working for all content types** (Apify **facebook-posts-scraper** + tab-specific URLs)
- **Reels tab** — real view counts for **Facebook Pages** via `/{page}/reels/` (personal profiles: also tries `?sk=videos_reels`, `/videos/`); **confirmed with Zossper: ~54K avg views/reel**
- **Photos tab** — real engagement (likes + comments + shares) for **pages and profiles** via `/photos/` or `/photos_by/` (profile-aware URL order)
- **Text posts tab** — real engagement via `/{page}/posts/`
- **Personal profiles** — real photo and text engagement; **reels stay estimated** (Facebook blocks reel scraping for most personal profiles)
- Stat boxes show real data with **"30d avg"** subtitle when ≥3 posts in last 30 days; **no Est. label** when real data is available
- **`usesRealReelViews`**, **`usesRealImageViews`**, **`usesRealTextEngagement`** flags on API + Pages UI

## Completed (earlier)

- Landing page
- Login & signup with real Supabase authentication
- Protected routes (logged-in users only)
- Apify integration (`APIFY_API_KEY` → light scraper; Playwright fallback)
- Traffic light color system, engagement chart (Recharts)

## Next session

1. Stripe payments
2. Mobile responsive design
3. Landing page update
