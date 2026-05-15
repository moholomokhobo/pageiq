import { AppShell } from "@/components/app-shell";
import { AiToolsClient } from "./ai-tools-client";

export default function AiToolsPage() {
  return (
    <AppShell active="AI Tools">
      <AiToolsClient />
    </AppShell>
  );
}
