import { GeminiService, GeminiError } from "@/lib/ai/gemini.client";
import { interventionAiSchema } from "@/lib/ai/schemas";
import { buildInterventionPrompt } from "@/lib/ai/prompts/intervention";
import { fallbackIntervention } from "@/lib/ai/fallbacks";
import { classifyEntryReason, classifyText } from "@/lib/safety/classifier";
import { getEmergencyOptions } from "@/lib/safety/emergency";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import {
  completeIntervention,
  createIntervention,
  findInterventionById,
  listCompletedInterventions,
  markStepComplete,
} from "@/lib/repositories/intervention.repository";
import { findUserById } from "@/lib/repositories/user.repository";
import type {
  EntryReason,
  Intervention,
  InterventionOutcome,
} from "@/types";

export async function startIntervention(input: {
  userId: string;
  entryReason: EntryReason;
  initialIntensity?: number;
  context?: string;
}): Promise<{
  intervention: Intervention;
  escalate: boolean;
  emergencyOptions?: ReturnType<typeof getEmergencyOptions>;
  usedFallback: boolean;
  aiErrorCode?: string;
}> {
  const reasonSafety = classifyEntryReason(input.entryReason);
  const textSafety = classifyText(input.context);
  const escalate = reasonSafety.escalate || textSafety.escalate;

  if (escalate || input.entryReason === "urgent_help") {
    const fallback = fallbackIntervention("urgent_help");
    const intervention = await createIntervention({
      userId: input.userId,
      entryReason: input.entryReason,
      initialIntensity: input.initialIntensity,
      context: input.context,
      recommendedTool: "urgent",
      acknowledgement: "Your safety comes first.",
      steps: fallback.steps,
      riskLevel: "urgent",
    });
    return {
      intervention,
      escalate: true,
      emergencyOptions: getEmergencyOptions(),
      usedFallback: true,
    };
  }

  const user = await findUserById(input.userId);
  const profile = await findProfileByUserId(input.userId);
  const recent = await listCompletedInterventions(input.userId, 5);
  const recentOutcomes = recent.map(
    (r) =>
      `${r.recommendedTool}:${r.outcome ?? "unknown"} (intensity ${r.initialIntensity ?? "?"}->${r.finalIntensity ?? "?"})`
  );

  let usedFallback = false;
  let aiErrorCode: string | undefined;
  let aiResult = fallbackIntervention(
    input.entryReason,
    profile?.motivations ?? []
  );

  try {
    const prompt = buildInterventionPrompt({
      alias: user?.alias ?? null,
      entryReason: input.entryReason,
      triggers: profile?.triggers ?? [],
      copingStrategies: profile?.copingStrategies ?? [],
      motivations: profile?.motivations ?? [],
      motivationCustom: profile?.motivationCustom,
      recentOutcomes,
      intensity: input.initialIntensity,
      context: input.context,
    });
    const generated = await GeminiService.generateStructured(
      prompt,
      interventionAiSchema
    );
    aiResult = {
      ...generated,
      resourceTags: generated.resourceTags ?? [],
    };
  } catch (err) {
    usedFallback = true;
    if (err instanceof GeminiError) aiErrorCode = err.code;
  }

  if (aiResult.riskLevel === "urgent") {
    const intervention = await createIntervention({
      userId: input.userId,
      entryReason: input.entryReason,
      initialIntensity: input.initialIntensity,
      context: input.context,
      recommendedTool: "urgent",
      acknowledgement: aiResult.acknowledgement,
      steps: aiResult.steps,
      riskLevel: "urgent",
    });
    return {
      intervention,
      escalate: true,
      emergencyOptions: getEmergencyOptions(),
      usedFallback,
      aiErrorCode,
    };
  }

  const intervention = await createIntervention({
    userId: input.userId,
    entryReason: input.entryReason,
    initialIntensity: input.initialIntensity,
    context: input.context,
    recommendedTool: aiResult.recommendedTool,
    acknowledgement: aiResult.acknowledgement,
    steps: aiResult.steps,
    riskLevel: aiResult.riskLevel,
  });

  return { intervention, escalate: false, usedFallback, aiErrorCode };
}

export async function advanceStep(userId: string, interventionId: string, stepIndex: number) {
  const intervention = await findInterventionById(interventionId);
  if (!intervention || intervention.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return markStepComplete(interventionId, stepIndex);
}

export async function finishIntervention(
  userId: string,
  interventionId: string,
  outcome: InterventionOutcome,
  finalIntensity?: number
) {
  const intervention = await findInterventionById(interventionId);
  if (!intervention || intervention.userId !== userId) {
    throw new Error("NOT_FOUND");
  }
  return completeIntervention(interventionId, outcome, finalIntensity);
}
