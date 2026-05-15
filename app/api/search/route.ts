import { scrapeFacebookPage } from "@/lib/facebook-scraper";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pageName = searchParams.get("q") ?? searchParams.get("page");

  if (!pageName?.trim()) {
    return NextResponse.json(
      { error: "Missing page name. Use ?q=PageName" },
      { status: 400 }
    );
  }

  try {
    const data = await scrapeFacebookPage(pageName);
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to search Facebook page.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
