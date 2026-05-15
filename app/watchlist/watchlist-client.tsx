"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { WatchlistRow } from "@/app/api/watchlist/route";
import {
  piqLabel,
  piqTrafficLevel,
  trafficTextClass,
} from "@/lib/traffic-light";

function pageInitials(name: string) {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

export function WatchlistClient() {
  const [items, setItems] = useState<WatchlistRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const loadWatchlist = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/watchlist");
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to load watchlist");
      }
      setItems(data.items ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load watchlist"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadWatchlist();
  }, [loadWatchlist]);

  async function removeItem(id: string) {
    setRemovingId(id);
    try {
      const res = await fetch(`/api/watchlist/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to remove page");
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to remove page"
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <>
      <header className="border-b border-blue-100 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Watchlist</h1>
        <p className="text-sm text-slate-500 dark:text-zinc-400">
          Facebook pages you are tracking
        </p>
      </header>

      <main className="flex-1 overflow-auto p-6">
        {error ? (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
          >
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-slate-500 dark:text-zinc-400">Loading watchlist…</p>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">
              No pages saved yet
            </p>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              Search a Facebook page on the dashboard and add it to your
              watchlist.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700"
            >
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article
                key={item.id}
                className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-bold text-white shadow-md shadow-blue-600/30">
                      {pageInitials(item.page_name)}
                    </span>
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold text-slate-900 dark:text-white">
                        {item.page_name}
                      </h2>
                      <a
                        href={item.page_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-0.5 block truncate text-xs text-blue-600 hover:underline dark:text-blue-400"
                      >
                        View on Facebook
                      </a>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-zinc-400">
                      PIQ
                    </p>
                    <p
                      className={`text-2xl font-bold ${trafficTextClass(
                        piqTrafficLevel(item.piq_score)
                      )}`}
                    >
                      {item.piq_score}
                    </p>
                    <p
                      className={`text-xs ${trafficTextClass(
                        piqTrafficLevel(item.piq_score)
                      )}`}
                    >
                      {piqLabel(item.piq_score)}
                    </p>
                  </div>
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-400">Followers</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {item.page_followers}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-slate-500 dark:text-zinc-400">Added</dt>
                    <dd className="font-semibold text-slate-900 dark:text-white">
                      {new Date(item.added_at).toLocaleDateString()}
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  disabled={removingId === item.id}
                  className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-red-900 dark:hover:bg-red-950/50 dark:hover:text-red-300"
                >
                  {removingId === item.id ? "Removing…" : "Remove"}
                </button>
              </article>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
