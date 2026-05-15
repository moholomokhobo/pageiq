import Link from "next/link";

export type NavLabel =
  | "Dashboard"
  | "Discover"
  | "Watchlist"
  | "Compare"
  | "AI Tools";

const navItems: { label: NavLabel; href: string }[] = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Discover", href: "/discover" },
  { label: "Watchlist", href: "/watchlist" },
  { label: "Compare", href: "/compare" },
  { label: "AI Tools", href: "/ai-tools" },
];

function PageLogo() {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-md shadow-blue-600/25">
        <svg
          className="h-5 w-5 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      </span>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        Page<span className="text-blue-600 dark:text-blue-400">IQ</span>
      </span>
    </Link>
  );
}

export function AppSidebar({ active }: { active: NavLabel }) {
  return (
    <aside className="flex w-64 shrink-0 flex-col border-r border-blue-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-blue-100 px-5 py-5 dark:border-zinc-800">
        <PageLogo />
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => {
          const isActive = item.label === active;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-blue-400"
              }`}
            >
              <NavIcon label={item.label} active={isActive} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-blue-100 p-4 dark:border-zinc-800">
        <div className="rounded-xl bg-blue-50 p-4 dark:bg-zinc-800">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
            Pro tip
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-zinc-300">
            Save pages from search results to track them on your watchlist.
          </p>
        </div>
      </div>
    </aside>
  );
}

function NavIcon({ label, active }: { label: NavLabel; active: boolean }) {
  const className = `h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400 dark:text-zinc-500"}`;

  switch (label) {
    case "Dashboard":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      );
    case "Discover":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      );
    case "Watchlist":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
      );
    case "Compare":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      );
    case "AI Tools":
      return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      );
    default:
      return null;
  }
}
