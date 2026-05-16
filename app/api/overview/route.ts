import { fetchOverviewDashboardData } from "@/lib/overview-queries";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const data = await fetchOverviewDashboardData();
  return NextResponse.json(data);
}
