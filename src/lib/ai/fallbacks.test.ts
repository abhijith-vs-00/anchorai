import { describe, expect, it } from "vitest";
import { fallbackIntervention } from "@/lib/ai/fallbacks";
import { violatesWordingPolicy } from "@/lib/safety/policies";

describe("fallbacks", () => {
  it("returns steps for cant_explain", () => {
    const result = fallbackIntervention("cant_explain");
    expect(result.recommendedTool).toBe("cant_explain_flow");
    expect(result.steps.length).toBeGreaterThan(0);
  });
});

describe("wording policy", () => {
  it("flags disallowed claims", () => {
    expect(violatesWordingPolicy("As an AI language model I know")).toBe(true);
    expect(violatesWordingPolicy("I'm here with you.")).toBe(false);
  });
});
