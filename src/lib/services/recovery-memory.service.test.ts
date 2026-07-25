import { describe, expect, it } from "vitest";
import { computePatterns } from "@/lib/services/recovery-memory.service";
import type { Intervention } from "@/types";

function makeIntervention(
  partial: Partial<Intervention> & Pick<Intervention, "recommendedTool" | "outcome">
): Intervention {
  return {
    _id: "x",
    userId: "u",
    entryReason: "urge",
    steps: [],
    completedSteps: [],
    createdAt: new Date(),
    ...partial,
  };
}

describe("recovery memory patterns", () => {
  it("computes helped / total from outcomes", () => {
    const interventions = [
      makeIntervention({ recommendedTool: "ground_me", outcome: "much_better" }),
      makeIntervention({ recommendedTool: "ground_me", outcome: "worse" }),
      makeIntervention({ recommendedTool: "ground_me", outcome: "a_little_better" }),
    ];
    const patterns = computePatterns(interventions, []);
    const ground = patterns.find((p) => p.toolOrStrategy === "Grounding");
    expect(ground?.helpedCount).toBe(2);
    expect(ground?.totalCount).toBe(3);
    expect(ground?.statement).toContain("2 of 3");
  });

  it("returns empty when no outcomes", () => {
    expect(computePatterns([], [])).toEqual([]);
  });
});
