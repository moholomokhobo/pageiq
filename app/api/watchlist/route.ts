import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export type WatchlistRow = {
  id: string;
  user_id: string;
  page_url: string;
  page_name: string;
  page_followers: string;
  piq_score: number;
  added_at: string;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("watchlist")
    .select("*")
    .eq("user_id", user.id)
    .order("added_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const pageUrl = body.pageUrl?.trim();
  const pageName = body.pageName?.trim();
  const pageFollowers = body.pageFollowers?.trim();
  const piqScore = Number(body.piqScore);

  if (!pageUrl || !pageName || !pageFollowers || Number.isNaN(piqScore)) {
    return NextResponse.json(
      { error: "Missing pageUrl, pageName, pageFollowers, or piqScore" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("watchlist")
    .insert({
      user_id: user.id,
      page_url: pageUrl,
      page_name: pageName,
      page_followers: pageFollowers,
      piq_score: piqScore,
    })
    .select()
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "This page is already on your watchlist." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ item: data });
}
