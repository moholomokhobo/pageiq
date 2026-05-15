import { parseEngagementRate } from "@/lib/metrics";

export type TrafficLevel = "good" | "average" | "poor";
export type MultiplierLevel = "average" | "good" | "excellent";

export function outlierTrafficLevel(score: number): TrafficLevel {
  if (score >= 71) return "good";
  if (score >= 41) return "average";
  return "poor";
}

/** @deprecated Use outlierTrafficLevel */
export const piqTrafficLevel = outlierTrafficLevel;

export function engagementTrafficLevel(ratePercent: number): TrafficLevel {
  if (ratePercent > 3) return "good";
  if (ratePercent >= 1) return "average";
  return "poor";
}

export function engagementTrafficLevelFromString(rate: string): TrafficLevel {
  return engagementTrafficLevel(parseEngagementRate(rate));
}

export function followerGrowthTrafficLevel(growthPercent: number): TrafficLevel {
  if (growthPercent > 5) return "good";
  if (growthPercent >= 0) return "average";
  return "poor";
}

export function parseGrowthPercent(raw: string): number {
  const match = raw.replace(/%/g, "").trim().match(/^([+-]?[\d.]+)/);
  return match ? parseFloat(match[1]) : 0;
}

export function followerGrowthTrafficLevelFromString(change: string): TrafficLevel {
  return followerGrowthTrafficLevel(parseGrowthPercent(change));
}

export function parseMultiplier(raw: string): number {
  return parseFloat(raw.replace(/x/gi, "").trim()) || 0;
}

export function multiplierTrafficLevel(multiplier: number): MultiplierLevel {
  if (multiplier >= 4) return "excellent";
  if (multiplier >= 2) return "good";
  return "average";
}

export function multiplierTrafficLevelFromString(raw: string): MultiplierLevel {
  return multiplierTrafficLevel(parseMultiplier(raw));
}

const textByLevel: Record<TrafficLevel | MultiplierLevel, string> = {
  good: "text-green-600 dark:text-green-400",
  average: "text-orange-600 dark:text-orange-400",
  poor: "text-red-600 dark:text-red-400",
  excellent: "font-bold text-green-500 dark:text-green-300",
};

const barByLevel: Record<TrafficLevel | MultiplierLevel, string> = {
  good: "bg-green-500 dark:bg-green-400",
  average: "bg-orange-500 dark:bg-orange-400",
  poor: "bg-red-500 dark:bg-red-400",
  excellent: "bg-green-400 dark:bg-green-300",
};

const ringByLevel: Record<TrafficLevel, string> = {
  good: "ring-2 ring-green-500/40",
  average: "ring-2 ring-orange-500/40",
  poor: "ring-2 ring-red-500/40",
};

export function trafficTextClass(
  level: TrafficLevel | MultiplierLevel
): string {
  return textByLevel[level];
}

export function trafficBarClass(
  level: TrafficLevel | MultiplierLevel
): string {
  return barByLevel[level];
}

export function trafficRingClass(level: TrafficLevel): string {
  return ringByLevel[level];
}

export function outlierLabel(score: number): string {
  const level = outlierTrafficLevel(score);
  if (level === "good") return "Hidden gem potential";
  if (level === "average") return "Rising outlier";
  return "Building audience";
}

/** @deprecated Use outlierLabel */
export const piqLabel = outlierLabel;

/** Compare page: winner green, loser red, tie neutral */
export function compareMetricTextClass(
  side: "left" | "right",
  winner: "left" | "right" | "tie"
): string {
  if (winner === "tie") return "text-slate-900 dark:text-white";
  if (winner === side) {
    return "font-semibold text-green-600 dark:text-green-400";
  }
  return "font-semibold text-red-600 dark:text-red-400";
}

export function compareMetricCardClass(
  side: "left" | "right",
  winner: "left" | "right" | "tie"
): string {
  if (winner === "tie") return "";
  if (winner === side) return "ring-2 ring-green-500/40";
  return "ring-2 ring-red-500/40";
}

export function compareBarClass(
  side: "left" | "right",
  winner: "left" | "right" | "tie"
): string {
  if (winner === "tie") return "bg-slate-600 dark:bg-zinc-300";
  if (winner === side) return "bg-green-500 dark:bg-green-400";
  return "bg-red-500 dark:bg-red-400";
}
