/**
 * One-off seed runner. Start dev server first: npm run dev
 * Requires: APIFY_API_KEY, SUPABASE_SERVICE_ROLE_KEY in .env.local
 * Optional: SEED_PAGES_SECRET, SEED_BASE_URL
 */
const base = process.env.SEED_BASE_URL ?? "http://localhost:3000";
const secret = process.env.SEED_PAGES_SECRET?.trim();

const headers = { "Content-Type": "application/json" };
if (secret) headers.Authorization = `Bearer ${secret}`;

const response = await fetch(`${base}/api/seed-pages`, { method: "POST", headers });
const body = await response.json();
console.log(JSON.stringify(body, null, 2));
if (!response.ok) process.exit(1);
