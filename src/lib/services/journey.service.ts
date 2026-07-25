import { listCheckins } from "@/lib/repositories/checkin.repository";
import { listInterventions } from "@/lib/repositories/intervention.repository";
import { listSetbacks } from "@/lib/repositories/setback.repository";
import type { Checkin, Intervention, Setback } from "@/types";

export interface JourneyStats {
  monthLabel: string;
  daysInMonth: number;
  recoveryDays: number;
  difficultMoments: number;
  momentsOvercome: number;
  setbacks: number;
  reachedOut: number;
  toolsUsed: number;
}

function startOfMonth(d = new Date()): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function daysInMonth(d = new Date()): number {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
}

/** Pure aggregator — easy to unit test without MongoDB */
export function computeJourneyStatsFromData(
  checkins: Checkin[],
  interventions: Intervention[],
  setbacks: Setback[],
  now = new Date()
): JourneyStats {
  const since = startOfMonth(now);

  const monthCheckins = checkins.filter((c) => new Date(c.createdAt) >= since);
  const monthInterventions = interventions.filter(
    (i) => new Date(i.createdAt) >= since
  );
  const monthSetbacks = setbacks.filter((s) => new Date(s.createdAt) >= since);

  const daySet = new Set<string>();
  for (const c of monthCheckins) {
    if (c.state === "good" || c.state === "a_little_off") {
      daySet.add(new Date(c.createdAt).toDateString());
    }
  }
  for (const i of monthInterventions) {
    daySet.add(new Date(i.createdAt).toDateString());
  }

  const difficultMoments =
    monthCheckins.filter((c) => c.state !== "good").length +
    monthInterventions.length;

  const momentsOvercome = monthInterventions.filter(
    (i) => i.outcome === "much_better" || i.outcome === "a_little_better"
  ).length;

  const reachedOut = monthInterventions.filter(
    (i) => i.recommendedTool === "reach_someone"
  ).length;

  return {
    monthLabel: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
    daysInMonth: daysInMonth(now),
    recoveryDays: daySet.size,
    difficultMoments,
    momentsOvercome,
    setbacks: monthSetbacks.length,
    reachedOut,
    toolsUsed: monthInterventions.length,
  };
}

export async function getJourneyStats(userId: string): Promise<JourneyStats> {
  const [checkins, interventions, setbacks] = await Promise.all([
    listCheckins(userId, 200),
    listInterventions(userId, 200),
    listSetbacks(userId, 200),
  ]);
  return computeJourneyStatsFromData(checkins, interventions, setbacks);
}
