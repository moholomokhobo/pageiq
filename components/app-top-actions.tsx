"use client";

import { AccountMenu } from "@/components/account-menu";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppTopActions() {
  return (
    <div className="flex shrink-0 items-center gap-2">
      <ThemeToggle />
      <AccountMenu />
    </div>
  );
}
