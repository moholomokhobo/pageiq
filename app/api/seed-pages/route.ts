import { scrapeFacebookPageLight } from "@/lib/facebook-scraper-light";
import {
  mapScrapeToPageInsert,
  SEED_PAGES_CONFIG,
} from "@/lib/pages-database";
import { createAdminClient } from "@/lib/supabase/admin";
import { pagesDatabaseTable } from "@/lib/supabase/tables";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function authorizeSeed(request: Request): boolean {
  const secret = process.env.SEED_PAGES_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === "development";
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: Request) {
  if (!authorizeSeed(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.APIFY_API_KEY?.trim()) {
    return NextResponse.json(
      { error: "APIFY_API_KEY is not configured" },
      { status: 500 }
    );
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY is not configured" },
      { status: 500 }
    );
  }

  const supabase = createAdminClient();
  const results: {
    page_url: string;
    status: "ok" | "error";
    page_name?: string;
    error?: string;
  }[] = [];

  for (const target of SEED_PAGES_CONFIG) {
    try {
      const stats = await scrapeFacebookPageLight(target.url);
      const row = mapScrapeToPageInsert(target.url, stats, target.category);

      const { error } = await pagesDatabaseTable(supabase).upsert(
        {
          ...row,
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page_url" }
      );

      if (error) {
        results.push({
          page_url: target.url,
          status: "error",
          error: error.message,
        });
      } else {
        results.push({
          page_url: target.url,
          status: "ok",
          page_name: row.page_name,
        });
      }
    } catch (err) {
      results.push({
        page_url: target.url,
        status: "error",
        error: err instanceof Error ? err.message : "Scrape failed",
      });
    }

    await sleep(2_000);
  }

  const ok = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    seeded: ok,
    failed,
    total: SEED_PAGES_CONFIG.length,
    results,
  });
}

export async function GET(request: Request) {
  return POST(request);
}
