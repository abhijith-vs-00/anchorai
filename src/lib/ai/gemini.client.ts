import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { isAiConfigured } from "@/lib/env";

export class GeminiError extends Error {
  code: string;
  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    this.name = "GeminiError";
  }
}

function getClient() {
  const key = process.env.GEMINI_API_KEY?.trim();
  if (!key) {
    throw new GeminiError(
      "AI_NOT_CONFIGURED",
      "Anchor's AI support is not configured."
    );
  }
  return new GoogleGenAI({ apiKey: key });
}

function getModel(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-flash-latest";
}

export async function generateStructured<T>(
  prompt: string,
  schema: z.ZodType<T>,
  options?: { temperature?: number }
): Promise<T> {
  if (!isAiConfigured()) {
    throw new GeminiError(
      "AI_NOT_CONFIGURED",
      "Anchor's AI support is temporarily unavailable."
    );
  }

  const attempt = async (): Promise<T> => {
    try {
      const ai = getClient();
      const response = await ai.models.generateContent({
        model: getModel(),
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.4,
          responseMimeType: "application/json",
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new GeminiError("AI_EMPTY", "Empty model response.");
      }

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        // Strip markdown fences if present
        const cleaned = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
        parsed = JSON.parse(cleaned);
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        throw new GeminiError(
          "AI_SCHEMA_INVALID",
          "Model returned unexpected shape."
        );
      }
      return validated.data;
    } catch (err) {
      if (err instanceof GeminiError) throw err;
      const message = err instanceof Error ? err.message : String(err);
      if (/429|RESOURCE_EXHAUSTED|quota|rate/i.test(message)) {
        throw new GeminiError(
          "AI_RATE_LIMITED",
          "Anchor's AI support is temporarily busy."
        );
      }
      if (/API_KEY|PERMISSION|401|403/i.test(message)) {
        throw new GeminiError(
          "AI_AUTH_FAILED",
          "Anchor's AI support is temporarily unavailable."
        );
      }
      throw new GeminiError("AI_FAILED", "Anchor's AI support is temporarily unavailable.");
    }
  };

  try {
    return await attempt();
  } catch (first) {
    if (
      first instanceof GeminiError &&
      (first.code === "AI_SCHEMA_INVALID" || first.code === "AI_EMPTY")
    ) {
      return await attempt();
    }
    throw first;
  }
}

export const GeminiService = {
  generateStructured,
  isConfigured: isAiConfigured,
};
