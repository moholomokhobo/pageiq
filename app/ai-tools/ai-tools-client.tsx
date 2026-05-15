"use client";

import type { CaptionsResponse } from "@/app/api/ai/captions/route";
import type { HookAnalyzerResponse } from "@/app/api/ai/hook-analyzer/route";
import type { PostingScheduleResponse } from "@/app/api/ai/posting-schedule/route";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  piqTrafficLevel,
  trafficTextClass,
} from "@/lib/traffic-light";
import { FormEvent, useState } from "react";

const cardClass =
  "rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-600 dark:bg-zinc-900";

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 px-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 disabled:opacity-60 dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-blue-500 dark:focus:bg-zinc-800";

const labelClass = "mb-1.5 block text-sm font-medium text-slate-700 dark:text-zinc-300";

const buttonClass =
  "rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-600/25 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60";

function ToolHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">
        {description}
      </p>
    </div>
  );
}

function ErrorAlert({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/50 dark:text-red-200"
    >
      {message}
    </p>
  );
}

function CaptionWriterTool() {
  const [niche, setNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [captions, setCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const res = await fetch("/api/ai/captions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, topic }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate captions.");
      }
      setCaptions((data as CaptionsResponse).captions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate captions."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cardClass}>
      <ToolHeader
        title="Caption Writer"
        description="Generate 5 Facebook captions tuned for engagement in your niche."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={labelClass}>Page niche</span>
            <input
              type="text"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              placeholder="e.g. fitness coaching, local bakery"
              disabled={loading}
              className={inputClass}
              required
            />
          </label>
          <label className="block">
            <span className={labelClass}>Post topic</span>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. morning routine tips"
              disabled={loading}
              className={inputClass}
              required
            />
          </label>
        </div>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Generating…" : "Generate"}
        </button>
      </form>
      {error ? <ErrorAlert message={error} /> : null}
      {captions.length > 0 ? (
        <ol className="mt-6 space-y-3">
          {captions.map((caption, i) => (
            <li
              key={i}
              className="rounded-xl border border-gray-200 bg-slate-50 p-4 text-sm text-slate-800 dark:border-gray-600 dark:bg-zinc-800 dark:text-zinc-100"
            >
              <span className="mb-2 block text-xs font-semibold uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Option {i + 1}
              </span>
              {caption}
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}

function HookAnalyzerTool() {
  const [caption, setCaption] = useState("");
  const [result, setResult] = useState<HookAnalyzerResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/hook-analyzer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to analyze caption.");
      }
      setResult(data as HookAnalyzerResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to analyze caption."
      );
    } finally {
      setLoading(false);
    }
  }


  return (
    <section className={cardClass}>
      <ToolHeader
        title="Hook Analyzer"
        description="Paste a caption to see how it might perform and how to improve it."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className={labelClass}>Post caption</span>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Paste your Facebook post caption here…"
            disabled={loading}
            rows={5}
            className={`${inputClass} resize-y`}
            required
          />
        </label>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </form>
      {error ? <ErrorAlert message={error} /> : null}
      {result ? (
        <div className="mt-6 space-y-5">
          <div className="flex flex-wrap items-end gap-4 rounded-xl border border-gray-200 bg-slate-50 p-5 dark:border-gray-600 dark:bg-zinc-800">
            <div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">
                Performance score
              </p>
              <p
                className={`text-4xl font-bold ${trafficTextClass(
                  piqTrafficLevel(result.score)
                )}`}
              >
                {result.score}
                <span className="text-lg font-medium text-slate-400 dark:text-zinc-500">
                  /100
                </span>
              </p>
            </div>
            <p className="min-w-0 flex-1 text-sm text-slate-700 dark:text-zinc-200">
              {result.verdict}
            </p>
          </div>

          <AnalysisList title="Strengths" items={result.strengths} variant="positive" />
          <AnalysisList title="Weaknesses" items={result.weaknesses} variant="negative" />
          <AnalysisList title="Suggestions" items={result.suggestions} variant="neutral" />
        </div>
      ) : null}
    </section>
  );
}

function AnalysisList({
  title,
  items,
  variant,
}: {
  title: string;
  items: string[];
  variant: "positive" | "negative" | "neutral";
}) {
  if (items.length === 0) return null;

  const dotClass =
    variant === "positive"
      ? "bg-green-500"
      : variant === "negative"
        ? "bg-red-500"
        : "bg-orange-500";

  return (
    <div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
        {title}
      </h3>
      <ul className="mt-2 space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2 text-sm text-slate-700 dark:text-zinc-300"
          >
            <span
              className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${dotClass}`}
            />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function BestTimeToPostTool() {
  const [niche, setNiche] = useState("");
  const [result, setResult] = useState<PostingScheduleResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/ai/posting-schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Failed to generate schedule.");
      }
      setResult(data as PostingScheduleResponse);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate schedule."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className={cardClass}>
      <ToolHeader
        title="Best Time to Post"
        description="Get a recommended weekly posting schedule for your niche."
      />
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block max-w-md">
          <span className={labelClass}>Page niche</span>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. real estate, parenting, SaaS"
            disabled={loading}
            className={inputClass}
            required
          />
        </label>
        <button type="submit" disabled={loading} className={buttonClass}>
          {loading ? "Generating…" : "Generate schedule"}
        </button>
      </form>
      {error ? <ErrorAlert message={error} /> : null}
      {result ? (
        <div className="mt-6 space-y-6">
          <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-600">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-slate-50 dark:border-gray-600 dark:bg-zinc-800">
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">
                    Day
                  </th>
                  <th className="px-4 py-3 font-semibold text-slate-600 dark:text-zinc-300">
                    Best times
                  </th>
                  <th className="hidden px-4 py-3 font-semibold text-slate-600 sm:table-cell dark:text-zinc-300">
                    Why
                  </th>
                </tr>
              </thead>
              <tbody>
                {result.schedule.map((slot) => (
                  <tr
                    key={slot.day}
                    className="border-b border-gray-200 last:border-0 dark:border-gray-600"
                  >
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">
                      {slot.day}
                    </td>
                    <td className="px-4 py-3 text-slate-700 dark:text-zinc-200">
                      {slot.times.join(", ")}
                    </td>
                    <td className="hidden px-4 py-3 text-slate-500 sm:table-cell dark:text-zinc-400">
                      {slot.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {result.tips.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Tips for your niche
              </h3>
              <ul className="mt-2 space-y-2">
                {result.tips.map((tip, i) => (
                  <li
                    key={i}
                    className="text-sm text-slate-700 dark:text-zinc-300"
                  >
                    · {tip}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}

export function AiToolsClient() {
  return (
    <>
      <header className="border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-600 dark:bg-zinc-900">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              AI Tools
            </h1>
            <p className="text-sm text-slate-500 dark:text-zinc-400">
              AI-powered helpers for Facebook content and growth
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-6">
          <CaptionWriterTool />
          <HookAnalyzerTool />
          <BestTimeToPostTool />
        </div>
      </main>
    </>
  );
}
