"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { discoverCategories, type DiscoverPage } from "@/lib/discover-data";
import {
  engagementTrafficLevelFromString,
  piqLabel,
  piqTrafficLevel,
  trafficTextClass,
} from "@/lib/traffic-light";
import Link from "next/link";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-zinc-900";

function pageInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function DiscoverPageCard({ page }: { page: DiscoverPage }) {
  const dashboardHref = `/dashboard?q=${encodeURIComponent(page.searchQuery)}`;

  return (
    <article className={`${cardClass} flex flex-col`}>
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-600/30">
          {pageInitials(page.pageName)}
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-semibold text-slate-900 dark:text-white">
            {page.pageName}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-zinc-400">
            {page.niche}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-zinc-400">Followers</dt>
          <dd className="font-semibold text-slate-900 dark:text-white">
            {page.followerCount}
          </dd>
        </div>
        <div>
          <dt className="text-slate-500 dark:text-zinc-400">Engagement</dt>
          <dd
            className={`font-semibold ${trafficTextClass(
              engagementTrafficLevelFromString(page.engagementRate)
            )}`}
          >
            {page.engagementRate}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-slate-500 dark:text-zinc-400">PIQ score</dt>
          <dd className="flex items-baseline gap-2">
            <span
              className={`text-2xl font-bold ${trafficTextClass(
                piqTrafficLevel(page.piqScore)
              )}`}
            >
              {page.piqScore}
            </span>
            <span
              className={`text-xs font-medium ${trafficTextClass(
                piqTrafficLevel(page.piqScore)
              )}`}
            >
              {piqLabel(page.piqScore)}
            </span>
          </dd>
        </div>
      </dl>

      <Link
        href={dashboardHref}
        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
      >
        View Analytics
      </Link>
    </article>
  );
}

function CategorySection({
  name,
  pages,
}: {
  name: string;
  pages: DiscoverPage[];
}) {
  return (
    <section>
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        {name}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {pages.length} pages to explore
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {pages.map((page) => (
          <DiscoverPageCard key={page.pageName} page={page} />
        ))}
      </div>
    </section>
  );
}

export function DiscoverClient() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-600 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Discover
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              Browse top Facebook pages by category
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex max-w-7xl flex-col gap-10">
          {discoverCategories.map((category) => (
            <CategorySection
              key={category.id}
              name={category.name}
              pages={category.pages}
            />
          ))}
        </div>
      </main>
    </>
  );
}
