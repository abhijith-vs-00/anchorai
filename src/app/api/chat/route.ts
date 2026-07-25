import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { startOrContinueChat } from "@/lib/services/chat.service";
import { listChatSessions, findChatSession } from "@/lib/repositories/chat.repository";

const schema = z.object({
  message: z.string().min(1).max(1000),
  sessionId: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return fail("VALIDATION_ERROR", "Invalid chat message.");
    const result = await startOrContinueChat({ userId, ...parsed.data });
    return ok(result);
  } catch (err) {
    console.error("[chat]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET(req: Request) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const id = new URL(req.url).searchParams.get("id");
    if (id) {
      const session = await findChatSession(id);
      if (!session || session.userId !== userId) {
        return fail("NOT_FOUND", "Chat not found.", 404);
      }
      return ok({ session });
    }
    const sessions = await listChatSessions(userId);
    return ok({ sessions });
  } catch {
    return serverError();
  }
}
