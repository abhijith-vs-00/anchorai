import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { advanceStep } from "@/lib/services/intervention.service";

const schema = z.object({
  stepIndex: z.number().int().min(0).max(20),
});

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const { id } = await ctx.params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid step.");
    const intervention = await advanceStep(userId, id, parsed.data.stepIndex);
    if (!intervention) return fail("NOT_FOUND", "Intervention not found.", 404);
    return ok({ intervention });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return fail("NOT_FOUND", "Intervention not found.", 404);
    }
    console.error("[interventions/step]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
