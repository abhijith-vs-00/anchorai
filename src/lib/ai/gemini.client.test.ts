import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";

const generateContent = vi.fn();

vi.mock("@google/genai", () => ({
  GoogleGenAI: vi.fn().mockImplementation(() => ({
    models: { generateContent },
  })),
}));

vi.mock("@/lib/env", () => ({
  isAiConfigured: () => Boolean(process.env.GEMINI_API_KEY?.trim()),
}));

import { generateStructured, GeminiError } from "@/lib/ai/gemini.client";

const tinySchema = z.object({ reply: z.string() });

describe("generateStructured", () => {
  beforeEach(() => {
    generateContent.mockReset();
    process.env.GEMINI_API_KEY = "test-key";
    process.env.GEMINI_MODEL = "gemini-flash-latest";
  });

  it("parses valid JSON against schema", async () => {
    generateContent.mockResolvedValue({
      text: JSON.stringify({ reply: "I'm here." }),
    });
    const result = await generateStructured("prompt", tinySchema);
    expect(result.reply).toBe("I'm here.");
  });

  it("strips markdown fences", async () => {
    generateContent.mockResolvedValue({
      text: '```json\n{"reply":"ok"}\n```',
    });
    const result = await generateStructured("prompt", tinySchema);
    expect(result.reply).toBe("ok");
  });

  it("maps quota errors to AI_RATE_LIMITED", async () => {
    generateContent.mockRejectedValue(new Error("429 RESOURCE_EXHAUSTED quota"));
    await expect(generateStructured("prompt", tinySchema)).rejects.toMatchObject({
      code: "AI_RATE_LIMITED",
    });
  });

  it("maps auth errors to AI_AUTH_FAILED", async () => {
    generateContent.mockRejectedValue(new Error("API_KEY invalid 401"));
    await expect(generateStructured("prompt", tinySchema)).rejects.toMatchObject({
      code: "AI_AUTH_FAILED",
    });
  });

  it("throws AI_NOT_CONFIGURED when key missing", async () => {
    process.env.GEMINI_API_KEY = "";
    await expect(generateStructured("prompt", tinySchema)).rejects.toBeInstanceOf(
      GeminiError
    );
    await expect(generateStructured("prompt", tinySchema)).rejects.toMatchObject({
      code: "AI_NOT_CONFIGURED",
    });
  });

  it("retries once on schema invalid then succeeds", async () => {
    generateContent
      .mockResolvedValueOnce({ text: JSON.stringify({ wrong: true }) })
      .mockResolvedValueOnce({ text: JSON.stringify({ reply: "recovered" }) });
    const result = await generateStructured("prompt", tinySchema);
    expect(result.reply).toBe("recovered");
    expect(generateContent).toHaveBeenCalledTimes(2);
  });
});
