"use client";

import type { EngagementDayPoint } from "@/lib/engagement-series";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type EngagementChartProps = {
  data: EngagementDayPoint[];
};

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: { payload: EngagementDayPoint }[];
}) {
  if (!active || !payload?.length) return null;

  const point = payload[0].payload;
  return (
    <div className="rounded-lg border border-gray-200 bg-white px-3 py-2 shadow-md dark:border-gray-600 dark:bg-zinc-900">
      <p className="text-xs font-medium text-slate-500 dark:text-zinc-400">
        Day {point.day} · {point.dateLabel}
      </p>
      <p className="mt-0.5 text-sm font-bold text-blue-600 dark:text-blue-400">
        {point.score.toLocaleString()} engagement
      </p>
    </div>
  );
}

export function EngagementChart({ data }: EngagementChartProps) {
  const xTicks = [
    data[0]?.dateLabel,
    data[14]?.dateLabel,
    data[29]?.dateLabel,
  ].filter(Boolean) as string[];

  return (
    <div
      className="h-44 w-full min-h-44"
      style={{ minHeight: 176, height: 176 }}
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={176}>
        <BarChart
          data={data}
          margin={{ top: 8, right: 4, left: -12, bottom: 0 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
          />
          <XAxis
            dataKey="dateLabel"
            ticks={xTicks}
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            dy={8}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            width={36}
            tickFormatter={(value: number) =>
              value >= 1000 ? `${(value / 1000).toFixed(0)}k` : String(value)
            }
          />
          <Tooltip
            content={<ChartTooltip />}
            cursor={{ fill: "rgba(37, 99, 235, 0.08)" }}
          />
          <defs>
            <linearGradient id="engagementBarGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#60a5fa" />
              <stop offset="100%" stopColor="#2563eb" />
            </linearGradient>
          </defs>
          <Bar
            dataKey="score"
            fill="url(#engagementBarGradient)"
            radius={[4, 4, 0, 0]}
            maxBarSize={14}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
