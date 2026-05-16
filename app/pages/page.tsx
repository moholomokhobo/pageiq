import { AppShell } from "@/components/app-shell";
import { PagesClient } from "./pages-client";

export default function PagesPage() {
  return (
    <AppShell active="Pages">
      <PagesClient />
    </AppShell>
  );
}
