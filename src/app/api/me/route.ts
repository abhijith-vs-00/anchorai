import { fail, ok, serverError } from "@/lib/api/response";
import { getSessionUserId } from "@/lib/session";
import { getJourneyStats } from "@/lib/services/journey.service";
import { getRecoveryMemory } from "@/lib/services/recovery-memory.service";
import { findUserById, sanitizeUser } from "@/lib/repositories/user.repository";
import { findProfileByUserId } from "@/lib/repositories/profile.repository";
import { listChatSessions } from "@/lib/repositories/chat.repository";
import { listCompletedInterventions } from "@/lib/repositories/intervention.repository";

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return fail("UNAUTHORIZED", "Sign in required.", 401);
    const [user, profile, journey, memory, chats, interventions] =
      await Promise.all([
        findUserById(userId),
        findProfileByUserId(userId),
        getJourneyStats(userId),
        getRecoveryMemory(userId),
        listChatSessions(userId, 10),
        listCompletedInterventions(userId, 20),
      ]);
    if (!user) return fail("UNAUTHORIZED", "Sign in required.", 401);

    const avgDistress =
      chats.filter((c) => c.distressLevel != null).length > 0
        ? chats.reduce((s, c) => s + (c.distressLevel ?? 0), 0) /
          chats.filter((c) => c.distressLevel != null).length
        : null;

    const analysis = {
      chatSessions: chats.length,
      avgDistress: avgDistress ? Math.round(avgDistress * 10) / 10 : null,
      recentInsights: chats
        .filter((c) => c.summary)
        .slice(0, 5)
        .map((c) => c.summary!),
      outcomeMix: {
        better: interventions.filter(
          (i) =>
            i.outcome === "much_better" || i.outcome === "a_little_better"
        ).length,
        same: interventions.filter((i) => i.outcome === "about_the_same").length,
        worse: interventions.filter((i) => i.outcome === "worse").length,
      },
    };

    return ok({
      user: sanitizeUser(user),
      profile,
      journey,
      memory,
      analysis,
    });
  } catch (err) {
    console.error("[me]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}
