import { GeminiService, GeminiError } from "@/lib/ai/gemini.client";
import { preventionPlanAiSchema } from "@/lib/ai/schemas";
import { buildPreventionPrompt } from "@/lib/ai/prompts/prevention";
import { findUserById } from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import { createPlan, listPlans, findPlanById } from "@/lib/repositories/plan.repository";
import { getRecoveryMemory } from "@/lib/services/recovery-memory.service";
import type { PreventionPlan } from "@/types";

function fallbackPlan(
  situation: string,
  motivations: string[],
  coping: string[]
): PreventionPlan["generatedPlan"] {
  const why = motivations[0] ?? "what matters to you";
  const strategy = coping[0] ?? "a short walk or grounding breath";
  return {
    before: [
      "Eat something and hydrate beforehand",
      "Tell a trusted person your plan",
      "Decide when and how you'll leave if needed",
    ],
    ifDifficult: [
      "Step outside or change rooms",
      "Open Anchor and use Help Me Now",
      `Try ${strategy}`,
    ],
    exitPlan: ["Call or message a safe person", "Leave the situation early if needed"],
    rememberWhy: why,
  };
}

export async function createPreventionPlan(input: {
  userId: string;
  situation: string;
}): Promise<{ plan: PreventionPlan; usedFallback: boolean; aiErrorCode?: string }> {
  const [user, profile, memory] = await Promise.all([
    findUserById(input.userId),
    findProfileByUserId(input.userId),
    getRecoveryMemory(input.userId),
  ]);

  const motivations = profile?.motivations ?? [];
  const coping = profile?.copingStrategies ?? [];
  let generated = fallbackPlan(input.situation, motivations, coping);
  let usedFallback = false;
  let aiErrorCode: string | undefined;

  try {
    generated = await GeminiService.generateStructured(
      buildPreventionPrompt({
        alias: user?.alias ?? null,
        situation: input.situation,
        triggers: profile?.triggers ?? [],
        copingStrategies: coping,
        motivations,
        motivationCustom: profile?.motivationCustom,
        memoryInsights: memory.patterns.map((p) => p.statement),
      }),
      preventionPlanAiSchema
    );
  } catch (err) {
    usedFallback = true;
    if (err instanceof GeminiError) aiErrorCode = err.code;
  }

  const plan = await createPlan({
    userId: input.userId,
    situation: input.situation,
    generatedPlan: generated,
  });

  return { plan, usedFallback, aiErrorCode };
}

export async function getUserPlans(userId: string) {
  return listPlans(userId);
}

export async function getPlan(userId: string, planId: string) {
  const plan = await findPlanById(planId);
  if (!plan || plan.userId !== userId) return null;
  return plan;
}
