import { AppShell } from "@/components/app-shell";
import { WatchlistClient } from "./watchlist-client";

export default function WatchlistPage() {
  return (
    <AppShell active="Watchlist">
      <WatchlistClient />
    </AppShell>
  );
}
