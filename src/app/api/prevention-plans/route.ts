import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import {
  createPreventionPlan,
  getPlan,
  getUserPlans,
} from "@/lib/services/prevention.service";

const schema = z.object({
  situation: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid plan request.");
    const result = await createPreventionPlan({
      userId,
      situation: parsed.data.situation,
    });
    return ok(result);
  } catch (err) {
    console.error("[prevention-plans]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (id) {
      const plan = await getPlan(userId, id);
      if (!plan) return fail("NOT_FOUND", "Plan not found.", 404);
      return ok({ plan });
    }
    const plans = await getUserPlans(userId);
    return ok({ plans });
  } catch {
    return serverError();
  }
}
