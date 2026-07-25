import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getCompanionGuidance } from "@/lib/services/companion.service";

const schema = z.object({
  relationship: z.string().min(1).max(80),
  situation: z.string().min(1).max(120),
});

export async function POST(req: Request) {
  try {
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid companion request.");
    }
    const guidance = await getCompanionGuidance(parsed.data);
    return ok({ guidance });
  } catch (err) {
    console.error("[companion]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
