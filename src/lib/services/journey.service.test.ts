import { describe, expect, it } from "vitest";
import { computeJourneyStatsFromData } from "@/lib/services/journey.service";
import type { Checkin, Intervention, Setback } from "@/types";

const now = new Date(2026, 6, 15); // July 15, 2026

function chk(
  partial: Partial<Checkin> & Pick<Checkin, "state">
): Checkin {
  return {
    _id: "c",
    userId: "u",
    createdAt: now,
    ...partial,
  };
}

function intv(
  partial: Partial<Intervention> &
    Pick<Intervention, "recommendedTool" | "outcome">
): Intervention {
  return {
    _id: "i",
    userId: "u",
    entryReason: "urge",
    steps: [],
    completedSteps: [],
    createdAt: now,
    ...partial,
  };
}

describe("computeJourneyStatsFromData", () => {
  it("returns zeros with no data", () => {
    const stats = computeJourneyStatsFromData([], [], [], now);
    expect(stats.recoveryDays).toBe(0);
    expect(stats.difficultMoments).toBe(0);
    expect(stats.momentsOvercome).toBe(0);
    expect(stats.setbacks).toBe(0);
    expect(stats.toolsUsed).toBe(0);
    expect(stats.daysInMonth).toBe(31);
  });

  it("counts recovery days, overcome moments, and setbacks", () => {
    const checkins: Checkin[] = [
      chk({ state: "good" }),
      chk({ state: "struggling", trigger: "Work" }),
    ];
    const interventions: Intervention[] = [
      intv({ recommendedTool: "urge_surf", outcome: "much_better" }),
      intv({ recommendedTool: "reach_someone", outcome: "a_little_better" }),
      intv({ recommendedTool: "ground_me", outcome: "worse" }),
    ];
    const setbacks: Setback[] = [
      {
        _id: "s",
        userId: "u",
        precedingTrigger: "Work stress",
        urgePresent: "yes",
        possibleHelpfulAction: "Leave earlier",
        createdAt: now,
      },
    ];

    const stats = computeJourneyStatsFromData(
      checkins,
      interventions,
      setbacks,
      now
    );
    expect(stats.toolsUsed).toBe(3);
    expect(stats.momentsOvercome).toBe(2);
    expect(stats.reachedOut).toBe(1);
    expect(stats.setbacks).toBe(1);
    expect(stats.difficultMoments).toBe(1 + 3); // struggling checkin + interventions
    expect(stats.recoveryDays).toBeGreaterThanOrEqual(1);
  });

  it("ignores data from previous months", () => {
    const old = new Date(2026, 5, 1); // June
    const stats = computeJourneyStatsFromData(
      [chk({ state: "struggling", createdAt: old })],
      [intv({ recommendedTool: "urge_surf", outcome: "much_better", createdAt: old })],
      [
        {
          _id: "s",
          userId: "u",
          precedingTrigger: "x",
          urgePresent: "no",
          possibleHelpfulAction: "y",
          createdAt: old,
        },
      ],
      now
    );
    expect(stats.toolsUsed).toBe(0);
    expect(stats.setbacks).toBe(0);
    expect(stats.difficultMoments).toBe(0);
  });
});
