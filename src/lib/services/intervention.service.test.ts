import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ai/gemini.client", () => ({
  GeminiService: {
    generateStructured: vi.fn(),
    isConfigured: vi.fn(() => true),
  },
  GeminiError: class GeminiError extends Error {
    code: string;
    constructor(code: string, message: string) {
      super(message);
      this.code = code;
    }
  },
}));

vi.mock("@/lib/repositories/user.repository", () => ({
  findUserById: vi.fn(),
}));

vi.mock("@/lib/repositories/profile.repository", () => ({
  findProfileByUserId: vi.fn(),
}));

vi.mock("@/lib/repositories/intervention.repository", () => ({
  createIntervention: vi.fn(),
  findInterventionById: vi.fn(),
  listCompletedInterventions: vi.fn(),
  markStepComplete: vi.fn(),
  completeIntervention: vi.fn(),
}));

import { GeminiService, GeminiError } from "@/lib/ai/gemini.client";
import { findUserById } from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import {
  createIntervention,
  listCompletedInterventions,
} from "@/lib/repositories/intervention.repository";
import { startIntervention } from "@/lib/services/intervention.service";

describe("startIntervention (mocked AI + repos)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(findUserById).mockResolvedValue({
      _id: "usr_1",
      username: "phoenix",
      alias: "Phoenix",
      role: "recoverer",
      onboardingCompleted: true,
      isDemo: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(findProfileByUserId).mockResolvedValue({
      _id: "rp_1",
      userId: "usr_1",
      triggers: ["Work stress"],
      copingStrategies: ["Walking"],
      motivations: ["Family"],
      safeContacts: [],
      preferences: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(listCompletedInterventions).mockResolvedValue([]);
    vi.mocked(createIntervention).mockImplementation(async (input) => ({
      _id: "int_1",
      completedSteps: [],
      createdAt: new Date(),
      ...input,
    }));
  });

  it("escalates urgent_help without calling Gemini", async () => {
    const result = await startIntervention({
      userId: "usr_1",
      entryReason: "urgent_help",
    });
    expect(result.escalate).toBe(true);
    expect(result.emergencyOptions?.length).toBeGreaterThan(0);
    expect(GeminiService.generateStructured).not.toHaveBeenCalled();
  });

  it("uses Gemini structured output when available", async () => {
    vi.mocked(GeminiService.generateStructured).mockResolvedValue({
      riskLevel: "elevated",
      acknowledgement: "I'm here.",
      recommendedTool: "urge_surf",
      steps: [{ type: "instruction", text: "Breathe slowly." }],
      suggestContact: false,
      resourceTags: ["cravings"],
    });

    const result = await startIntervention({
      userId: "usr_1",
      entryReason: "urge",
      initialIntensity: 4,
    });

    expect(result.escalate).toBe(false);
    expect(result.usedFallback).toBe(false);
    expect(result.intervention.recommendedTool).toBe("urge_surf");
    expect(GeminiService.generateStructured).toHaveBeenCalled();
  });

  it("falls back when Gemini is rate limited", async () => {
    vi.mocked(GeminiService.generateStructured).mockRejectedValue(
      new GeminiError("AI_RATE_LIMITED", "busy")
    );

    const result = await startIntervention({
      userId: "usr_1",
      entryReason: "calm_down",
    });

    expect(result.usedFallback).toBe(true);
    expect(result.aiErrorCode).toBe("AI_RATE_LIMITED");
    expect(result.intervention.steps.length).toBeGreaterThan(0);
  });
});
