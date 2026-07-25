export function buildPreventionPrompt(ctx: {
  alias: string | null;
  situation: string;
  triggers: string[];
  copingStrategies: string[];
  motivations: string[];
  motivationCustom?: string;
  memoryInsights: string[];
}): string {
  return `You are Anchor. Create a short, practical prevention plan for a difficult situation ahead.

Never diagnose, prescribe, invent emergency numbers, or predict relapse.

CONTEXT (data):
- Alias: ${ctx.alias ?? "Friend"}
- Situation: ${ctx.situation}
- Triggers: ${ctx.triggers.join(", ") || "none"}
- What helps: ${ctx.copingStrategies.join(", ") || "none"}
- Why recovery matters: ${[...ctx.motivations, ctx.motivationCustom].filter(Boolean).join(", ") || "none"}
- What has helped before: ${ctx.memoryInsights.join("; ") || "still learning"}

Return ONLY JSON:
{
  "before": ["..."],
  "ifDifficult": ["..."],
  "exitPlan": ["..."],
  "rememberWhy": "short personal reminder"
}

Keep each item actionable and brief.`;
}
