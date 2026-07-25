import { listCompletedInterventions } from "@/lib/repositories/intervention.repository";
import { listCheckins } from "@/lib/repositories/checkin.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import { GeminiService } from "@/lib/ai/gemini.client";
import { memoryExplainAiSchema } from "@/lib/ai/schemas";

export interface MemoryPattern {
  triggerOrContext: string;
  toolOrStrategy: string;
  helpedCount: number;
  totalCount: number;
  statement: string;
}

export interface RecoveryMemoryResult {
  patterns: MemoryPattern[];
  timeHint: string | null;
  narrative: string;
  hasEnoughData: boolean;
}

const POSITIVE = new Set(["much_better", "a_little_better"]);

export function computePatterns(
  interventions: Awaited<ReturnType<typeof listCompletedInterventions>>,
  copingStrategies: string[]
): MemoryPattern[] {
  const byTool = new Map<string, { helped: number; total: number }>();
  for (const item of interventions) {
    if (!item.outcome) continue;
    const key = item.recommendedTool;
    const cur = byTool.get(key) ?? { helped: 0, total: 0 };
    cur.total += 1;
    if (POSITIVE.has(item.outcome)) cur.helped += 1;
    byTool.set(key, cur);
  }

  const toolLabels: Record<string, string> = {
    urge_surf: "Urge surfing",
    ground_me: "Grounding",
    change_environment: "Changing environment",
    remind_me_why: "Remembering why",
    reach_someone: "Reaching someone",
    cant_explain_flow: "Low-effort support",
    urgent: "Urgent support path",
  };

  const patterns: MemoryPattern[] = [];
  for (const [tool, stats] of byTool) {
    if (stats.total < 1) continue;
    patterns.push({
      triggerOrContext: "During difficult moments",
      toolOrStrategy: toolLabels[tool] ?? tool,
      helpedCount: stats.helped,
      totalCount: stats.total,
      statement: `${toolLabels[tool] ?? tool} helped ${stats.helped} of ${stats.total} times.`,
    });
  }

  // Tie coping strategies from blueprint when present
  for (const strategy of copingStrategies.slice(0, 3)) {
    const related = interventions.filter(
      (i) =>
        i.context?.toLowerCase().includes(strategy.toLowerCase()) ||
        i.acknowledgement?.toLowerCase().includes(strategy.toLowerCase())
    );
    if (related.length >= 2) {
      const helped = related.filter(
        (i) => i.outcome && POSITIVE.has(i.outcome)
      ).length;
      patterns.push({
        triggerOrContext: `When you lean on ${strategy}`,
        toolOrStrategy: strategy,
        helpedCount: helped,
        totalCount: related.length,
        statement: `${strategy} showed up in ${related.length} interventions; ${helped} felt better afterward.`,
      });
    }
  }

  return patterns.slice(0, 6);
}

export function computeEveningHint(
  checkins: Awaited<ReturnType<typeof listCheckins>>,
  interventions: Awaited<ReturnType<typeof listCompletedInterventions>>
): string | null {
  const difficultHours: number[] = [];
  for (const c of checkins) {
    if (c.state !== "good") difficultHours.push(new Date(c.createdAt).getHours());
  }
  for (const i of interventions) {
    difficultHours.push(new Date(i.createdAt).getHours());
  }
  if (difficultHours.length < 3) return null;
  const evening = difficultHours.filter((h) => h >= 17 || h < 5).length;
  if (evening / difficultHours.length >= 0.5) {
    return "You've reported more difficult moments during late evenings.";
  }
  return null;
}

export async function getRecoveryMemory(
  userId: string
): Promise<RecoveryMemoryResult> {
  const [interventions, checkins, profile] = await Promise.all([
    listCompletedInterventions(userId, 100),
    listCheckins(userId, 100),
    findProfileByUserId(userId),
  ]);

  const patterns = computePatterns(
    interventions,
    profile?.copingStrategies ?? []
  );
  const timeHint = computeEveningHint(checkins, interventions);
  const hasEnoughData = interventions.filter((i) => i.outcome).length >= 2;

  if (!hasEnoughData) {
    return {
      patterns: [],
      timeHint: null,
      narrative:
        "Anchor is still learning what works for you. Complete a few check-ins or interventions and patterns will appear here.",
      hasEnoughData: false,
    };
  }

  let narrative = patterns.map((p) => p.statement).join(" ");
  if (timeHint) narrative = `${narrative} ${timeHint}`.trim();

  try {
    if (GeminiService.isConfigured()) {
      const explained = await GeminiService.generateStructured(
        `Explain these recovery patterns briefly and supportively. Do not invent stats or predict relapse. Patterns: ${JSON.stringify(patterns)}. Time hint: ${timeHint ?? "none"}. Return JSON {"summary":"..."}`,
        memoryExplainAiSchema
      );
      narrative = explained.summary;
    }
  } catch {
    // keep deterministic narrative
  }

  return { patterns, timeHint, narrative, hasEnoughData };
}
