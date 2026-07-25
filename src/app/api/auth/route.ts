import { z } from "zod";
import { fail, ok, serverError } from "@/lib/api/response";
import { setSessionUserId, clearSession, getSessionUserId } from "@/lib/session";
import {
  createUser,
  findUserByLogin,
  findUserById,
  sanitizeUser,
  usernameExists,
  updateUser,
} from "@/lib/repositories/user.repository";
import { upsertRecoveryProfile } from "@/lib/repositories/profile.repository";
import {
  verifyPassword,
  normalizeUsername,
  isValidUsername,
  isValidEmail,
} from "@/lib/auth/password";
import type { UserRole } from "@/types";

const signupSchema = z.object({
  action: z.literal("signup"),
  role: z.enum(["recoverer", "companion"]),
  username: z.string().min(3).max(24),
  email: z.string().email().optional().or(z.literal("")),
  password: z.string().min(6).max(100),
  alias: z.string().max(40).optional(),
});

const loginSchema = z.object({
  action: z.literal("login"),
  login: z.string().min(3).max(120),
  password: z.string().min(1).max(100),
});

const demoSchema = z.object({
  action: z.literal("demo"),
  role: z.enum(["recoverer", "companion"]).default("recoverer"),
});

const logoutSchema = z.object({
  action: z.literal("logout"),
});

const bodySchema = z.discriminatedUnion("action", [
  signupSchema,
  loginSchema,
  demoSchema,
  logoutSchema,
]);

export async function POST(req: Request) {
  try {
    const parsed = bodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return fail("VALIDATION_ERROR", "Invalid auth request.");
    }
    const body = parsed.data;

    if (body.action === "logout") {
      await clearSession();
      return ok({ loggedOut: true });
    }

    if (body.action === "demo") {
      const stamp = Date.now().toString(36);
      const username =
        body.role === "companion" ? `demo_care_${stamp}` : `phoenix_${stamp}`;
      const user = await createUser({
        role: body.role,
        username,
        alias: body.role === "companion" ? "SupportiveFriend" : "Phoenix",
        password: `demo-${stamp}`,
        isDemo: true,
      });
      if (body.role === "recoverer") {
        await upsertRecoveryProfile({
          userId: user._id,
          triggers: ["Work stress", "Loneliness"],
          copingStrategies: ["Walking", "Talking to someone", "Breathing"],
          motivations: ["Family"],
          motivationCustom: "I want to be present for my family.",
        });
        await updateUser(user._id, {
          onboardingCompleted: true,
          sharedOverview: {
            triggers: ["Work stress", "Loneliness"],
            copingStrategies: ["Walking", "Talking to someone"],
            motivations: ["Family"],
            note: "Demo recoverer — labelled demo data.",
          },
        });
      }
      await setSessionUserId(user._id);
      const fresh = await findUserById(user._id);
      return ok({ user: sanitizeUser(fresh!) });
    }

    if (body.action === "signup") {
      const username = normalizeUsername(body.username);
      if (!isValidUsername(username)) {
        return fail(
          "VALIDATION_ERROR",
          "Username must be 3–24 characters: letters, numbers, underscore."
        );
      }
      if (await usernameExists(username)) {
        return fail("USERNAME_TAKEN", "That username is already taken.");
      }
      const email = body.email?.trim() || null;
      if (email && !isValidEmail(email)) {
        return fail("VALIDATION_ERROR", "Enter a valid email or leave it blank.");
      }
      const user = await createUser({
        role: body.role as UserRole,
        username,
        email,
        password: body.password,
        alias: body.alias?.trim() || username,
      });
      await setSessionUserId(user._id);
      return ok({ user: sanitizeUser(user) });
    }

    if (body.action === "login") {
      const user = await findUserByLogin(body.login);
      if (!user?.passwordHash) {
        return fail("AUTH_FAILED", "Invalid login or password.", 401);
      }
      const valid = await verifyPassword(body.password, user.passwordHash);
      if (!valid) {
        return fail("AUTH_FAILED", "Invalid login or password.", 401);
      }
      await setSessionUserId(user._id);
      return ok({ user: sanitizeUser(user) });
    }

    return fail("VALIDATION_ERROR", "Unknown action.");
  } catch (err) {
    console.error("[auth]", err instanceof Error ? err.message : "error");
    return serverError();
  }
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return ok({ user: null });
    const user = await findUserById(userId);
    if (!user) return ok({ user: null });
    return ok({ user: sanitizeUser(user) });
  } catch {
    return serverError();
  }
}
