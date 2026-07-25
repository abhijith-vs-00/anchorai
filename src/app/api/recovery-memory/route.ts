import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { getRecoveryMemory } from "@/lib/services/recovery-memory.service";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const memory = await getRecoveryMemory(userId);
    return ok({ memory });
  } catch (err) {
    console.error("[recovery-memory]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
