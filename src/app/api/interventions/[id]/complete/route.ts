import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { finishIntervention } from "@/lib/services/intervention.service";

const schema = z.object({
  outcome: z.enum([
    "much_better",
    "a_little_better",
    "about_the_same",
    "worse",
  ]),
  finalIntensity: z.number().int().min(1).max(5).optional(),
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
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid outcome.");
    const intervention = await finishIntervention(
      userId,
      id,
      parsed.data.outcome,
      parsed.data.finalIntensity
    );
    if (!intervention) return fail("NOT_FOUND", "Intervention not found.", 404);
    return ok({ intervention });
  } catch (err) {
    if (err instanceof Error && err.message === "NOT_FOUND") {
      return fail("NOT_FOUND", "Intervention not found.", 404);
    }
    console.error("[interventions/complete]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
