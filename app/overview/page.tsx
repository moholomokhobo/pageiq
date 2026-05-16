import { AppShell } from "@/components/app-shell";
import { fetchAllPagesFromDatabase } from "@/lib/overview-queries";
import { OverviewClient } from "./overview-client";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const sourceRows = await fetchAllPagesFromDatabase();

  return (
    <AppShell active="Overview">
      <OverviewClient sourceRows={sourceRows} />
    </AppShell>
  );
}
