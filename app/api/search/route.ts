import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function GET(request: Request) {
  console.log(
    "API KEY EXISTS:",
    Boolean(process.env.APIFY_API_KEY?.trim())
  );

  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get("q") ?? searchParams.get("page");

  if (!pageName?.trim()) {
    return NextResponse.json(
      { error: "Missing page name. Use ?q=PageName" },
      { status: 400 }
    );
  }

  try {
    const trimmed = pageName.trim();
    const useLightScraper = Boolean(process.env.APIFY_API_KEY?.trim());
    console.log(
      "Scraper selected:",
      useLightScraper ? "light (Apify)" : "Playwright"
    );

    const data = useLightScraper
      ? await (
          await import("@/lib/facebook-scraper-light")
        ).scrapeFacebookPageLight(trimmed)
      : await (
          await import("@/lib/facebook-scraper")
        ).scrapeFacebookPage(trimmed);

    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Facebook page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
