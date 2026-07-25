import { cookies } from "next/headers";
import { nanoid } from "nanoid";
import { createHmac, timingSafeEqual } from "crypto";
import { getEnv } from "@/lib/env";

const COOKIE_NAME = "anchor_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function sign(value: string): string {
  const secret = getEnv().SESSION_SECRET;
  const sig = createHmac("sha256", secret).update(value).digest("hex");
  return `${value}.${sig}`;
}

function verify(signed: string): string | null {
  const parts = signed.split(".");
  if (parts.length !== 2) return null;
  const [value, sig] = parts;
  const expected = createHmac("sha256", getEnv().SESSION_SECRET)
    .update(value)
    .digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return value;
  } catch {
    return null;
  }
}

export async function getSessionUserId(): Promise<string | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}

export async function setSessionUserId(userId: string): Promise<void> {
  const jar = await cookies();
  jar.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export function newId(prefix?: string): string {
  const id = nanoid(16);
  return prefix ? `${prefix}_${id}` : id;
}

export const ALIAS_SUGGESTIONS = [
  "Phoenix",
  "StillStanding",
  "NewBeginning",
  "SteadyTide",
  "QuietStrength",
  "DawnLight",
  "HoldFast",
  "RiverStone",
  "OpenSky",
  "BraveHarbor",
];

export function randomAlias(): string {
  return ALIAS_SUGGESTIONS[Math.floor(Math.random() * ALIAS_SUGGESTIONS.length)];
}
