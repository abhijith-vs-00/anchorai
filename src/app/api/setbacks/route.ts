import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { createSetback, listSetbacks } from "@/lib/repositories/setback.repository";

const schema = z.object({
  precedingTrigger: z.string().max(120),
  urgePresent: z.enum(["yes", "no", "dont_remember"]),
  possibleHelpfulAction: z.string().max(120),
  notes: z.string().max(500).optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid setback.");
    const setback = await createSetback({ userId, ...parsed.data });
    return ok({ setback });
  } catch (err) {
    console.error("[setbacks]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const setbacks = await listSetbacks(userId);
    return ok({ setbacks });
  } catch {
    return serverError();
  }
}
