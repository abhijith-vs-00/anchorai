import { GeminiService, GeminiError } from "@/lib/ai/gemini.client";
import { companionGuidanceAiSchema } from "@/lib/ai/schemas";
import { buildCompanionPrompt } from "@/lib/ai/prompts/companion";
import { findResourcesByTags } from "@/lib/repositories/resource.repository";
import { getEmergencyOptions } from "@/lib/safety/emergency";

export interface CompanionGuidance {
  tryThis: string[];
  avoidThis: string[];
  why: string;
  whenToSeekHelp: string;
  resources: Awaited<ReturnType<typeof findResourcesByTags>>;
  emergencyOptions: ReturnType<typeof getEmergencyOptions>;
  usedFallback: boolean;
  aiErrorCode?: string;
}

function fallbackGuidance(situation: string): Omit<
  CompanionGuidance,
  "resources" | "emergencyOptions" | "usedFallback" | "aiErrorCode"
> {
  return {
    tryThis: [
      "Listen first without trying to fix everything.",
      "Say: I'm here with you. You don't have to handle this alone.",
      "Offer a concrete next step: water, a short walk, or calling a helpline together.",
    ],
    avoidThis: [
      "Don't shame, lecture, or say just stop.",
      "Don't demand details they're not ready to share.",
      "Don't present yourself as their clinician.",
    ],
    why: `When someone is ${situation.toLowerCase()}, calm presence usually helps more than pressure. Support without surveillance protects trust.`,
    whenToSeekHelp:
      "If there is immediate danger, contact local emergency services. For ongoing substance-use support, use verified professional resources such as SAMHSA.",
  };
}

export async function getCompanionGuidance(input: {
  relationship: string;
  situation: string;
}): Promise<CompanionGuidance> {
  let guidance = fallbackGuidance(input.situation);
  let usedFallback = false;
  let aiErrorCode: string | undefined;
  let tags = ["supporting-someone", "professional-support"];

  try {
    const ai = await GeminiService.generateStructured(
      buildCompanionPrompt(input),
      companionGuidanceAiSchema
    );
    guidance = {
      tryThis: ai.tryThis,
      avoidThis: ai.avoidThis,
      why: ai.why,
      whenToSeekHelp: ai.whenToSeekHelp,
    };
    if (ai.resourceTags?.length) tags = ai.resourceTags;
  } catch (err) {
    usedFallback = true;
    if (err instanceof GeminiError) aiErrorCode = err.code;
  }

  const resources = await findResourcesByTags(tags);
  return {
    ...guidance,
    resources,
    emergencyOptions: getEmergencyOptions(),
    usedFallback,
    aiErrorCode,
  };
}
