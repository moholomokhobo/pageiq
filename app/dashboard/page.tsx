import Link from "next/link";
import { PageSearch } from "./page-search";

const navItems = [
  { label: "Dashboard", href: "/dashboard", active: true },
  { label: "Discover", href: "#", active: false },
  { label: "Watchlist", href: "#", active: false },
  { label: "Compare", href: "#", active: false },
  { label: "AI Tools", href: "#", active: false },
];

const engagementByDay = [
  42, 38, 55, 48, 62, 58, 71, 65, 78, 72, 85, 80, 76, 88, 92, 86, 94, 90,
  98, 95, 102, 88, 91, 105, 110, 98, 115, 108, 120, 118,
];

const outlierPosts = [
  {
    type: "Video",
    preview: "3 hooks that doubled our reach in 48 hours…",
    multiplier: "8.4x",
    engagement: "142K",
  },
  {
    type: "Reel",
    preview: "POV: you spot the trend before your competitors",
    multiplier: "6.2x",
    engagement: "98K",
  },
  {
    type: "Image",
    preview: "Weekly viral score breakdown — May edition",
    multiplier: "5.1x",
    engagement: "76K",
  },
  {
    type: "Carousel",
    preview: "5 posting windows that outperform the algorithm",
    multiplier: "4.7x",
    engagement: "61K",
  },
  {
    type: "Video",
    preview: "Behind the scenes: how we forecast outliers",
    multiplier: "4.2x",
    engagement: "54K",
  },
];

const statCards = [
  {
    label: "Followers",
    value: "284.2K",
    change: "+12.4%",
    positive: true,
  },
  {
    label: "Engagement Rate",
    value: "4.8%",
    change: "+0.6%",
    positive: true,
  },
  {
    label: "Posts This Month",
    value: "24",
    change: "+3",
    positive: true,
  },
  {
    label: "Outlier Posts",
    value: "7",
    change: "+2",
    positive: true,
  },
];

function PageLogo({ compact = false }: { compact?: boolean }) {
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
      {!compact && (
        <span className="text-lg font-bold tracking-tight text-slate-900">
          Page<span className="text-blue-600">IQ</span>
        </span>
      )}
    </Link>
  );
}

export default function DashboardPage() {
  const maxEngagement = Math.max(...engagementByDay);

  return (
    <div className="flex min-h-full bg-slate-50 font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-blue-100 bg-white">
        <div className="border-b border-blue-100 px-5 py-5">
          <PageLogo />
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                item.active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/25"
                  : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <NavIcon label={item.label} active={item.active} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-blue-100 p-4">
          <div className="rounded-xl bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
              Pro tip
            </p>
            <p className="mt-1 text-sm text-slate-600">
              Outlier posts are performing 4× above your page average this month.
            </p>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <header className="border-b border-blue-100 bg-white px-6 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="shrink-0">
              <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-sm text-slate-500">
                Facebook analytics · TechFlow Media
              </p>
            </div>
            <PageSearch />
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((stat) => (
              <article
                key={stat.label}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-slate-500">{stat.label}</p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {stat.value}
                </p>
                <p
                  className={`mt-2 text-sm font-medium ${
                    stat.positive ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {stat.change} vs last month
                </p>
              </article>
            ))}
          </div>

          <div className="mt-6 grid gap-6 xl:grid-cols-5">
            {/* Bar chart */}
            <section className="rounded-2xl border border-blue-100 bg-white p-6 shadow-sm xl:col-span-3">
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">
                    Engagement over 30 days
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Daily engagement score across all posts
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  Last 30 days
                </span>
              </div>

              <div className="flex h-48 items-end gap-1">
                {engagementByDay.map((value, i) => (
                  <div
                    key={i}
                    className="group relative flex-1"
                    title={`Day ${i + 1}: ${value}`}
                  >
                    <div
                      className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 opacity-90 transition group-hover:opacity-100"
                      style={{ height: `${(value / maxEngagement) * 100}%` }}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-3 flex justify-between text-xs text-slate-400">
                <span>Day 1</span>
                <span>Day 15</span>
                <span>Day 30</span>
              </div>
            </section>

            {/* Quick summary */}
            <section className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-600 to-blue-700 p-6 text-white shadow-lg shadow-blue-600/20 xl:col-span-2">
              <h2 className="text-lg font-semibold">Page health</h2>
              <p className="mt-2 text-sm text-blue-100">
                Your Facebook page is outperforming 82% of similar pages in your
                niche.
              </p>
              <div className="mt-6 space-y-4">
                {[
                  { label: "Reach", value: 92 },
                  { label: "Shares", value: 78 },
                  { label: "Comments", value: 85 },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="text-blue-100">{metric.label}</span>
                      <span className="font-semibold">{metric.value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-blue-500/40">
                      <div
                        className="h-full rounded-full bg-white"
                        style={{ width: `${metric.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Outlier posts table */}
          <section className="mt-6 overflow-hidden rounded-2xl border border-blue-100 bg-white shadow-sm">
            <div className="border-b border-blue-100 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Top outlier posts
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Posts performing significantly above your page average
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-3 font-semibold text-slate-600">
                      Type
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600">
                      Post preview
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600">
                      Multiplier
                    </th>
                    <th className="px-6 py-3 font-semibold text-slate-600">
                      Engagement
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {outlierPosts.map((post, i) => (
                    <tr
                      key={i}
                      className="border-b border-slate-50 transition hover:bg-blue-50/40"
                    >
                      <td className="px-6 py-4">
                        <span className="inline-flex rounded-lg bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">
                          {post.type}
                        </span>
                      </td>
                      <td className="max-w-xs px-6 py-4 text-slate-700">
                        <p className="truncate">{post.preview}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-emerald-600">
                          {post.multiplier}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {post.engagement}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function NavIcon({ label, active }: { label: string; active: boolean }) {
  const className = `h-5 w-5 shrink-0 ${active ? "text-white" : "text-slate-400"}`;

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
