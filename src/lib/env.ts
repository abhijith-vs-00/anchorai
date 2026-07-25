import { z } from "zod";

const envSchema = z.object({
  GEMINI_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-flash-latest"),
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  MONGODB_DB_NAME: z.string().default("anchor_dev"),
  APP_ENV: z
    .enum(["development", "preview", "production", "test"])
    .default("development"),
  SESSION_SECRET: z.string().min(16).default("anchor-dev-session-secret"),
});

export type AppEnv = z.infer<typeof envSchema>;

let cached: AppEnv | null = null;

export function getEnv(): AppEnv {
  if (cached) return cached;
  const parsed = envSchema.safeParse({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-flash-latest",
    MONGODB_URI: process.env.MONGODB_URI,
    MONGODB_DB_NAME: process.env.MONGODB_DB_NAME,
    APP_ENV: process.env.APP_ENV,
    SESSION_SECRET: process.env.SESSION_SECRET,
  });
  if (!parsed.success) {
    throw new Error(
      `Invalid environment: ${parsed.error.issues.map((i) => i.message).join(", ")}`
    );
  }
  cached = parsed.data;
  return cached;
}

export function isAiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

export function validateEnvConfig(input: Record<string, unknown>) {
  return envSchema.safeParse(input);
}
