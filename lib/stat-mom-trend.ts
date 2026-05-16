export type MomTrend = {
  label: string;
  positive: boolean;
};

/**
 * Simulated month-on-month % change from outlier score vs 50 baseline.
 * Above average engagement → green ↑; below → red ↓.
 */
export function simulatedMomTrend(
  outlierScore: number,
  metricKey: string,
  pageId: string
): MomTrend {
  const seed = [...pageId, metricKey].reduce(
    (sum, char) => sum + char.charCodeAt(0),
    0
  );
  const aboveAverage = outlierScore >= 50;
  const magnitude =
    6 + (seed % 14) + Math.floor(Math.abs(outlierScore - 50) / 8);
  const pct = Math.min(32, magnitude);
  const positive = aboveAverage;

  return {
    label: `${positive ? "+" : "-"}${pct}% ${positive ? "↑" : "↓"}`,
    positive,
  };
}
