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

vi.mock("@/lib/repositories/chat.repository", () => ({
  createChatSession: vi.fn(),
  findChatSession: vi.fn(),
  appendChatMessages: vi.fn(),
  listChatSessions: vi.fn(),
}));

import { GeminiService } from "@/lib/ai/gemini.client";
import { findUserById } from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import {
  appendChatMessages,
  createChatSession,
  findChatSession,
} from "@/lib/repositories/chat.repository";
import { startOrContinueChat } from "@/lib/services/chat.service";

describe("startOrContinueChat (mocked)", () => {
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
    vi.mocked(findProfileByUserId).mockResolvedValue(null);
    vi.mocked(findChatSession).mockResolvedValue(null);
    vi.mocked(createChatSession).mockResolvedValue({
      _id: "chat_1",
      userId: "usr_1",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    vi.mocked(appendChatMessages).mockImplementation(async (id, messages, meta) => ({
      _id: id,
      userId: "usr_1",
      messages,
      distressLevel: meta?.distressLevel,
      summary: meta?.summary,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  });

  it("returns Gemini reply and persists messages", async () => {
    vi.mocked(GeminiService.generateStructured).mockResolvedValue({
      reply: "I'm here with you.",
      distressLevel: 3,
      suggestUrgent: false,
      briefInsight: "Mild evening urge",
    });

    const result = await startOrContinueChat({
      userId: "usr_1",
      message: "Feeling lonely after work",
    });

    expect(result.reply).toBe("I'm here with you.");
    expect(result.distressLevel).toBe(3);
    expect(result.escalate).toBe(false);
    expect(result.usedFallback).toBe(false);
    expect(appendChatMessages).toHaveBeenCalled();
  });

  it("escalates on urgent user language even with soft AI reply", async () => {
    vi.mocked(GeminiService.generateStructured).mockResolvedValue({
      reply: "Let's breathe.",
      distressLevel: 2,
      suggestUrgent: false,
    });

    const result = await startOrContinueChat({
      userId: "usr_1",
      message: "I want to kill myself",
    });

    expect(result.escalate).toBe(true);
    expect(result.emergencyOptions?.length).toBeGreaterThan(0);
  });
});
