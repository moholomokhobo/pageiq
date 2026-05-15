import { AppShell } from "@/components/app-shell";
import { Suspense } from "react";
import { DashboardClient } from "./dashboard-client";

function DashboardLoading() {
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <p className="text-sm text-slate-500 dark:text-zinc-400">Loading…</p>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AppShell active="Dashboard">
      <Suspense fallback={<DashboardLoading />}>
        <DashboardClient />
      </Suspense>
    </AppShell>
  );
}
