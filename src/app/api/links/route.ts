import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import {
  findUserById,
  findUserByUsername,
  sanitizeUser,
  updateUser,
} from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import {
  createLink,
  listLinksForCompanion,
  listLinksForRecoverer,
} from "@/lib/repositories/link.repository";

const linkSchema = z.object({
  action: z.literal("link"),
  recovererUsername: z.string().min(3).max(24),
});

const shareSchema = z.object({
  action: z.literal("update_overview"),
  note: z.string().max(300).optional(),
});

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const user = await findUserById(userId);
    if (!user) return fail("UNAUTHORIZED", "Sign in required.", 401);

    if (user.role === "companion" || user.mode === "companion") {
      const links = await listLinksForCompanion(userId);
      const recoverers = await Promise.all(
        links.map(async (l) => {
          const r = await findUserById(l.recovererUserId);
          if (!r) return null;
          return {
            linkId: l._id,
            username: r.username,
            alias: r.alias,
            overview: r.sharedOverview ?? null,
          };
        })
      );
      return ok({ links, recoverers: recoverers.filter(Boolean) });
    }

    const links = await listLinksForRecoverer(userId);
    return ok({
      links,
      username: user.username,
      overview: user.sharedOverview ?? null,
    });
  } catch (err) {
    console.error("[links]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const user = await findUserById(userId);
    if (!user) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const body = await req.json();

    if (body.action === "update_overview") {
      const parsed = shareSchema.safeParse(body);
      if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid overview.");
      if (user.role === "companion") {
        return fail("FORBIDDEN", "Only recoverers share an overview.", 403);
      }
      const profile = await findProfileByUserId(userId);
      const updated = await updateUser(userId, {
        sharedOverview: {
          triggers: profile?.triggers ?? [],
          copingStrategies: profile?.copingStrategies ?? [],
          motivations: profile?.motivations ?? [],
          note: parsed.data.note,
        },
      });
      return ok({ user: sanitizeUser(updated!) });
    }

    if (body.action === "link") {
      const parsed = linkSchema.safeParse(body);
      if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid link request.");
      if (user.role !== "companion" && user.mode !== "companion") {
        return fail("FORBIDDEN", "Only companions can link to a recoverer.", 403);
      }
      const recoverer = await findUserByUsername(parsed.data.recovererUsername);
      if (!recoverer || recoverer.role === "companion") {
        return fail("NOT_FOUND", "No recoverer found with that username.", 404);
      }
      const link = await createLink({
        recovererUserId: recoverer._id,
        companionUserId: userId,
        recovererUsername: recoverer.username,
        companionUsername: user.username,
      });
      const linked = Array.from(
        new Set([...(recoverer.linkedRecovererIds ?? []), userId])
      );
      // store companion ids on recoverer for convenience
      await updateUser(recoverer._id, {
        linkedRecovererIds: [
          ...new Set([...(recoverer.linkedRecovererIds ?? []), userId]),
        ],
      });
      await updateUser(userId, {
        linkedRecovererIds: [
          ...new Set([...(user.linkedRecovererIds ?? []), recoverer._id]),
        ],
      });
      void linked;
      return ok({
        link,
        recoverer: {
          username: recoverer.username,
          alias: recoverer.alias,
          overview: recoverer.sharedOverview ?? null,
        },
      });
    }

    return fail("VALIDATION_ERROR", "Unknown action.");
  } catch (err) {
    console.error("[links]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
