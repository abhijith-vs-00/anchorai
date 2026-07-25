import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { startIntervention } from "@/lib/services/intervention.service";

const schema = z.object({
  entryReason: z.enum([
    "urge",
    "calm_down",
    "leave_situation",
    "cant_explain",
    "urgent_help",
  ]),
  initialIntensity: z.number().int().min(1).max(5).optional(),
  context: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid intervention request.");
    }
    const result = await startIntervention({ userId, ...parsed.data });
    return ok(result);
  } catch (err) {
    console.error("[interventions/start]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
