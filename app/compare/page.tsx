import { AppShell } from "@/components/app-shell";
import { CompareClient } from "./compare-client";

export default function ComparePage() {
  return (
    <AppShell active="Compare">
      <CompareClient />
    </AppShell>
  );
}
