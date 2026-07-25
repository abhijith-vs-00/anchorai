import { pingDb } from "@/lib/db/mongodb";
import { isAiConfigured } from "@/lib/env";
import { ok } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const database = (await pingDb()) ? "connected" : "unavailable";
  return ok({
    status: database === "connected" ? "ok" : "degraded",
    database,
    aiConfigured: isAiConfigured(),
    environment: process.env.APP_ENV || "development",
  });
}
