import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId, randomAlias } from "@/lib/session";
import {
  findUserById,
  sanitizeUser,
  updateUser,
} from "@/lib/repositories/user.repository";
import { upsertRecoveryProfile } from "@/lib/repositories/profile.repository";

const aliasSchema = z.object({
  action: z.literal("alias"),
  alias: z.string().max(40).nullable().optional(),
  random: z.boolean().optional(),
  skip: z.boolean().optional(),
});

const blueprintSchema = z.object({
  action: z.literal("blueprint"),
  triggers: z.array(z.string().max(80)).max(20),
  copingStrategies: z.array(z.string().max(80)).max(20),
  motivations: z.array(z.string().max(80)).max(20),
  motivationCustom: z.string().max(300).optional(),
  safeContacts: z
    .array(
      z.object({
        name: z.string().max(80),
        relationship: z.string().max(80),
        phone: z.string().max(40).optional(),
      })
    )
    .max(5)
    .optional(),
});

const bodySchema = z.discriminatedUnion("action", [aliasSchema, blueprintSchema]);

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid onboarding request.");
    }

    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Please sign in first.", 401);

    const body = parsed.data;

    if (body.action === "alias") {
      let alias: string | null = body.alias ?? null;
      if (body.random) alias = randomAlias();
      if (body.skip) alias = null;
      const user = await updateUser(userId, { alias });
      return ok({ user: user ? sanitizeUser(user) : null });
    }

    if (body.action === "blueprint") {
      const profile = await upsertRecoveryProfile({
        userId,
        triggers: body.triggers,
        copingStrategies: body.copingStrategies,
        motivations: body.motivations,
        motivationCustom: body.motivationCustom,
        safeContacts: body.safeContacts,
      });
      const user = await updateUser(userId, {
        onboardingCompleted: true,
        sharedOverview: {
          triggers: body.triggers,
          copingStrategies: body.copingStrategies,
          motivations: body.motivations,
          note: body.motivationCustom,
        },
      });
      return ok({ profile, user: user ? sanitizeUser(user) : null });
    }

    return fail("VALIDATION_ERROR", "Unknown action.");
  } catch (err) {
    console.error("[onboarding]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return ok({ user: null });
    const user = await findUserById(userId);
    return ok({ user: user ? sanitizeUser(user) : null });
  } catch {
    return serverError();
  }
}
