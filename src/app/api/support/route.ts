import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId, newId } from "@/lib/session";
import { findUserById } from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import {
  addReply,
  createSupportPost,
  findPostById,
  listOpenPosts,
  listPostsForLinkedRecoverers,
  listPostsForRecoverer,
} from "@/lib/repositories/support.repository";
import { listLinksForCompanion } from "@/lib/repositories/link.repository";

const createSchema = z.object({
  action: z.literal("create"),
  content: z.string().min(1).max(1000),
  isGeneral: z.boolean().default(true),
});

const replySchema = z.object({
  action: z.literal("reply"),
  postId: z.string(),
  content: z.string().min(1).max(1000),
});

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const user = await findUserById(userId);
    if (!user) return fail("UNAUTHORIZED", "Sign in required.", 401);

    const scope = new URL(req.url).searchParams.get("scope") || "board";

    if (scope === "mine") {
      const posts = await listPostsForRecoverer(userId);
      return ok({ posts });
    }

    if (user.role === "companion" || user.mode === "companion") {
      const links = await listLinksForCompanion(userId);
      const linkedIds = links.map((l) => l.recovererUserId);
      const [general, linked] = await Promise.all([
        listOpenPosts(),
        listPostsForLinkedRecoverers(linkedIds),
      ]);
      const map = new Map(general.map((p) => [p._id, p]));
      for (const p of linked) map.set(p._id, p);
      return ok({
        posts: Array.from(map.values()).sort(
          (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)
        ),
        links,
      });
    }

    const posts = await listPostsForRecoverer(userId);
    return ok({ posts });
  } catch (err) {
    console.error("[support]", err instanceof Error ? err.message : "error");
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
    if (body.action === "create") {
      const parsed = createSchema.safeParse(body);
      if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid post.");
      if (user.role === "companion") {
        return fail("FORBIDDEN", "Companions reply to posts; they don't create them.", 403);
      }
      const profile = await findProfileByUserId(userId);
      const overview = user.sharedOverview ?? {
        triggers: profile?.triggers ?? [],
        copingStrategies: profile?.copingStrategies ?? [],
        motivations: profile?.motivations ?? [],
        note: "Shared support request overview.",
      };
      const post = await createSupportPost({
        authorUserId: userId,
        authorAlias: user.alias || user.username || "Anonymous",
        overview,
        content: parsed.data.content,
        isGeneral: parsed.data.isGeneral,
      });
      return ok({ post });
    }

    if (body.action === "reply") {
      const parsed = replySchema.safeParse(body);
      if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid reply.");
      if (user.role !== "companion" && user.mode !== "companion") {
        return fail("FORBIDDEN", "Only companions can reply.", 403);
      }
      const existing = await findPostById(parsed.data.postId);
      if (!existing) return fail("NOT_FOUND", "Post not found.", 404);
      const post = await addReply(parsed.data.postId, {
        _id: newId("rpl"),
        companionUserId: userId,
        companionAlias: user.alias || user.username || "Companion",
        content: parsed.data.content,
      });
      return ok({ post });
    }

    return fail("VALIDATION_ERROR", "Unknown action.");
  } catch (err) {
    console.error("[support]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

