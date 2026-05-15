export function parseCountValue(raw: string): number {
  const cleaned = raw.replace(/,/g, "").trim();
  const match = cleaned.match(/^([\d.]+)\s*([KMB])?%?$/i);
  if (!match) return 0;

  let num = parseFloat(match[1]);
  const suffix = (match[2] ?? "").toUpperCase();
  if (suffix === "K") num *= 1_000;
  if (suffix === "M") num *= 1_000_000;
  if (suffix === "B") num *= 1_000_000_000;

  return num;
}

export function parseEngagementRate(raw: string): number {
  return parseCountValue(raw.replace("%", ""));
}

export type CompareWinner = "left" | "right" | "tie";

export function pickWinner(left: number, right: number): CompareWinner {
  if (left === right) return "tie";
  return left > right ? "left" : "right";
}

export function pageHealthFromOutlierScore(outlierScore: number) {
  return {
    reach: Math.min(98, Math.max(55, outlierScore + 8)),
    shares: Math.min(95, Math.max(50, outlierScore - 4)),
    comments: Math.min(96, Math.max(52, outlierScore + 2)),
  };
}

/** @deprecated Use pageHealthFromOutlierScore */
export const pageHealthFromPiq = pageHealthFromOutlierScore;
