import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { createCheckin, listCheckins } from "@/lib/repositories/checkin.repository";

const schema = z.object({
  state: z.enum(["good", "a_little_off", "struggling", "need_support"]),
  trigger: z.string().max(80).optional(),
  intensity: z.number().int().min(1).max(5).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid check-in.");
    const checkin = await createCheckin({ userId, ...parsed.data });
    return ok({ checkin });
  } catch (err) {
    console.error("[checkins]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const checkins = await listCheckins(userId);
    return ok({ checkins });
  } catch {
    return serverError();
  }
}
