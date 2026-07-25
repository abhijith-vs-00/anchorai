import { z } from "zod";

export const interventionStepSchema = z.object({
  type: z.enum(["instruction", "choice", "breathing", "timer", "action"]),
  text: z.string().min(1).max(500),
  options: z.array(z.string().max(80)).max(6).optional(),
});

export const interventionAiSchema = z.object({
  riskLevel: z.enum(["ok", "elevated", "urgent"]),
  acknowledgement: z.string().min(1).max(200),
  recommendedTool: z.enum([
    "urge_surf",
    "ground_me",
    "change_environment",
    "remind_me_why",
    "reach_someone",
    "cant_explain_flow",
  ]),
  steps: z.array(interventionStepSchema).min(1).max(8),
  suggestContact: z.boolean(),
  resourceTags: z.array(z.string()).max(8).optional().transform((v) => v ?? []),
});

export type InterventionAi = z.infer<typeof interventionAiSchema>;

export const preventionPlanAiSchema = z.object({
  before: z.array(z.string().min(1).max(200)).min(2).max(6),
  ifDifficult: z.array(z.string().min(1).max(200)).min(2).max(6),
  exitPlan: z.array(z.string().min(1).max(200)).min(1).max(4),
  rememberWhy: z.string().min(1).max(300),
});

export type PreventionPlanAi = z.infer<typeof preventionPlanAiSchema>;

export const companionGuidanceAiSchema = z.object({
  tryThis: z.array(z.string().min(1).max(300)).min(1).max(4),
  avoidThis: z.array(z.string().min(1).max(300)).min(1).max(4),
  why: z.string().min(1).max(500),
  whenToSeekHelp: z.string().min(1).max(500),
  resourceTags: z.array(z.string()).max(6).optional().transform((v) => v ?? []),
});

export type CompanionGuidanceAi = z.infer<typeof companionGuidanceAiSchema>;

export const memoryExplainAiSchema = z.object({
  summary: z.string().min(1).max(600),
});

export type MemoryExplainAi = z.infer<typeof memoryExplainAiSchema>;

export const messageDraftAiSchema = z.object({
  message: z.string().min(1).max(400),
});
