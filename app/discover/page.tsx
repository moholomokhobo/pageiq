import { AppShell } from "@/components/app-shell";
import { DiscoverClient } from "./discover-client";

export default function DiscoverPage() {
  return (
    <AppShell active="Discover">
      <DiscoverClient />
    </AppShell>
  );
}
