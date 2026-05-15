import { AppSidebar, type NavLabel } from "@/components/app-sidebar";

export function AppShell({
  active,
  children,
}: {
  active: NavLabel;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full max-w-full bg-slate-50 font-sans text-base text-slate-900 antialiased dark:bg-zinc-950 dark:text-white">
      <AppSidebar active={active} />
      <div className="flex min-h-screen min-w-0 w-full flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
