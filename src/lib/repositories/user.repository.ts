import { getDb } from "@/lib/db/mongodb";
import type { User, UserRole } from "@/types";
import { newId } from "@/lib/session";
import { hashPassword, normalizeUsername } from "@/lib/auth/password";

function roleFromLegacy(user: Partial<User>): UserRole {
  if (user.role === "recoverer" || user.role === "companion") return user.role;
  if (user.mode === "companion") return "companion";
  return "recoverer";
}

export function sanitizeUser(user: User) {
  const { passwordHash: _, ...safe } = user;
  return {
    ...safe,
    role: roleFromLegacy(user),
  };
}

export async function createUser(input: {
  role: UserRole;
  username: string;
  email?: string | null;
  password?: string;
  alias?: string | null;
  isDemo?: boolean;
}): Promise<User> {
  const now = new Date();
  const username = normalizeUsername(input.username);
  const user: User = {
    _id: newId("usr"),
    username,
    email: input.email?.trim().toLowerCase() || null,
    passwordHash: input.password ? await hashPassword(input.password) : null,
    alias: input.alias ?? username,
    role: input.role,
    mode: input.role === "companion" ? "companion" : "recovery",
    onboardingCompleted: input.role === "companion" || Boolean(input.isDemo),
    isDemo: Boolean(input.isDemo),
    sharedOverview: undefined,
    linkedRecovererIds: [],
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  await db.collection<User>("users").insertOne(user);
  return user;
}

export async function findUserById(id: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({ _id: id });
}

export async function findUserByUsername(username: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({
    username: normalizeUsername(username),
  });
}

export async function findUserByEmail(email: string): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOne({
    email: email.trim().toLowerCase(),
  });
}

export async function findUserByLogin(login: string): Promise<User | null> {
  const value = login.trim();
  if (value.includes("@")) return findUserByEmail(value);
  return findUserByUsername(value);
}

export async function updateUser(
  id: string,
  patch: Partial<
    Pick<
      User,
      | "alias"
      | "onboardingCompleted"
      | "role"
      | "sharedOverview"
      | "linkedRecovererIds"
      | "email"
    >
  >
): Promise<User | null> {
  const db = await getDb();
  return db.collection<User>("users").findOneAndUpdate(
    { _id: id },
    { $set: { ...patch, updatedAt: new Date() } },
    { returnDocument: "after" }
  );
}

export async function usernameExists(username: string): Promise<boolean> {
  const existing = await findUserByUsername(username);
  return Boolean(existing);
}
