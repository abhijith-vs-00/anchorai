import { describe, expect, it } from "vitest";
import { interventionAiSchema, preventionPlanAiSchema } from "@/lib/ai/schemas";
import { validateEnvConfig } from "@/lib/env";

describe("AI schemas", () => {
  it("accepts valid intervention payload", () => {
    const parsed = interventionAiSchema.safeParse({
      riskLevel: "elevated",
      acknowledgement: "I'm here.",
      recommendedTool: "urge_surf",
      steps: [{ type: "instruction", text: "Breathe slowly." }],
      suggestContact: false,
      resourceTags: ["cravings"],
    });
    expect(parsed.success).toBe(true);
  });

  it("rejects empty steps", () => {
    const parsed = interventionAiSchema.safeParse({
      riskLevel: "ok",
      acknowledgement: "Hi",
      recommendedTool: "ground_me",
      steps: [],
      suggestContact: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts prevention plan", () => {
    const parsed = preventionPlanAiSchema.safeParse({
      before: ["Eat", "Tell someone"],
      ifDifficult: ["Step outside", "Open Anchor"],
      exitPlan: ["Leave early"],
      rememberWhy: "Family",
    });
    expect(parsed.success).toBe(true);
  });
});

describe("env validation", () => {
  it("requires mongodb uri", () => {
    const result = validateEnvConfig({
      MONGODB_URI: "",
      SESSION_SECRET: "long-enough-secret!!",
    });
    expect(result.success).toBe(false);
  });

  it("accepts minimal valid env", () => {
    const result = validateEnvConfig({
      MONGODB_URI: "mongodb://localhost:27017",
      SESSION_SECRET: "long-enough-secret!!",
      APP_ENV: "test",
    });
    expect(result.success).toBe(true);
  });
});
