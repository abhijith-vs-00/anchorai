import { describe, expect, it } from "vitest";
import { violatesWordingPolicy } from "@/lib/safety/policies";
import { getEmergencyOptions } from "@/lib/safety/emergency";
import { classifyText } from "@/lib/safety/classifier";

describe("safety policies + emergency options", () => {
  it("flags disallowed AI wording", () => {
    expect(violatesWordingPolicy("As an AI language model...")).toBe(true);
    expect(violatesWordingPolicy("I'm here.")).toBe(false);
  });

  it("returns curated emergency options with no invented numbers-only claim", () => {
    const opts = getEmergencyOptions();
    expect(opts.length).toBeGreaterThanOrEqual(3);
    expect(opts.some((o) => o.id === "samhsa")).toBe(true);
    expect(opts.some((o) => o.type === "continue")).toBe(true);
  });

  it("does not escalate ordinary urge language", () => {
    expect(classifyText("I have a strong urge after work").escalate).toBe(false);
  });
});
