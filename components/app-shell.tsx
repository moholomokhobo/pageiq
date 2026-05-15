import { AppSidebar, type NavLabel } from "@/components/app-sidebar";

export function AppShell({
  active,
  children,
}: {
  active: NavLabel;
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh w-full overflow-hidden bg-slate-50 font-sans text-base text-slate-900 antialiased dark:bg-zinc-950 dark:text-white">
      <div className="fixed inset-y-0 left-0 z-40 w-64">
        <AppSidebar active={active} />
      </div>
      <div className="ml-64 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
