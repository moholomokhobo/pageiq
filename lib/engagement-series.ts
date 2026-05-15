export type EngagementDayPoint = {
  day: number;
  dateLabel: string;
  score: number;
};

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash || 1;
}

function createSeededRandom(seed: number) {
  let state = seed % 2147483646 || 1;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function parseEngagementPercent(rate: string): number {
  const match = rate.match(/([\d.]+)/);
  if (!match) return 3;
  return Math.min(15, Math.max(0.1, parseFloat(match[1])));
}

/**
 * Builds 30 days of engagement scores (oldest → newest) with natural variation.
 */
export function generateEngagementSeries(options: {
  pageName: string;
  outlierScore: number;
  engagementRate?: string;
  postsLast30Days?: number;
}): EngagementDayPoint[] {
  const { pageName, outlierScore, engagementRate = "3%", postsLast30Days = 12 } =
    options;

  const seed = hashString(pageName.toLowerCase().trim());
  const random = createSeededRandom(seed);
  const rate = parseEngagementPercent(engagementRate);

  const base =
    Math.max(25, outlierScore * 0.85 + rate * 8 + Math.min(postsLast30Days, 20) * 1.2);
  const amplitude = base * 0.22;
  const trendSlope = (random() - 0.35) * 0.35;

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const points: EngagementDayPoint[] = [];

  for (let i = 0; i < 30; i += 1) {
    const dayOffset = 29 - i;
    const date = new Date(today);
    date.setDate(today.getDate() - dayOffset);

    const weekly =
      Math.sin((i / 7) * Math.PI * 2 + seed * 0.01) * amplitude * 0.45;
    const midMonthBump =
      Math.sin((i / 30) * Math.PI) * amplitude * 0.25;
    const noise = (random() - 0.5) * amplitude * 0.9;
    const trend = i * trendSlope;

    let score = base + weekly + midMonthBump + noise + trend;

    if (random() > 0.88) {
      score *= 1.35 + random() * 0.55;
    } else if (random() < 0.1) {
      score *= 0.72 + random() * 0.15;
    }

    const weekend = date.getDay();
    if (weekend === 0 || weekend === 6) {
      score *= 1.05 + random() * 0.08;
    }

    points.push({
      day: i + 1,
      dateLabel: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      score: Math.round(Math.max(12, score)),
    });
  }

  return points;
}
