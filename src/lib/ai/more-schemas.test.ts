import { describe, expect, it } from "vitest";
import {
  companionGuidanceAiSchema,
  preventionPlanAiSchema,
} from "@/lib/ai/schemas";
import { z } from "zod";

const chatSchema = z.object({
  reply: z.string().min(1).max(800),
  distressLevel: z.number().int().min(1).max(5),
  suggestUrgent: z.boolean(),
  briefInsight: z.string().max(200).optional(),
});

describe("companion + prevention + chat schemas", () => {
  it("accepts companion guidance", () => {
    const parsed = companionGuidanceAiSchema.safeParse({
      tryThis: ["Listen first"],
      avoidThis: ["Don't lecture"],
      why: "Presence helps more than pressure.",
      whenToSeekHelp: "If immediate danger, call local emergency services.",
      resourceTags: ["supporting-someone"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty tryThis", () => {
    const parsed = companionGuidanceAiSchema.safeParse({
      tryThis: [],
      avoidThis: ["x"],
      why: "because",
      whenToSeekHelp: "when",
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts prevention plan", () => {
    expect(
      preventionPlanAiSchema.safeParse({
        before: ["Eat", "Tell someone"],
        ifDifficult: ["Step outside", "Open Anchor"],
        exitPlan: ["Leave"],
        rememberWhy: "Family",
      }).success
    ).toBe(true);
  });

  it("accepts chat AI payload", () => {
    expect(
      chatSchema.safeParse({
        reply: "I'm here with you.",
        distressLevel: 3,
        suggestUrgent: false,
      }).success
    ).toBe(true);
  });

  it("rejects invalid distressLevel", () => {
    expect(
      chatSchema.safeParse({
        reply: "Hi",
        distressLevel: 9,
        suggestUrgent: false,
      }).success
    ).toBe(false);
  });
});
