import { getDb } from "@/lib/db/mongodb";
import type { Setback } from "@/types";
import { newId } from "@/lib/session";

export async function createSetback(input: {
  userId: string;
  precedingTrigger: string;
  urgePresent: "yes" | "no" | "dont_remember";
  possibleHelpfulAction: string;
  notes?: string;
}): Promise<Setback> {
  const setback: Setback = {
    _id: newId("sb"),
    userId: input.userId,
    precedingTrigger: input.precedingTrigger,
    urgePresent: input.urgePresent,
    possibleHelpfulAction: input.possibleHelpfulAction,
    notes: input.notes,
    createdAt: new Date(),
  };
  const db = await getDb();
  await db.collection<Setback>("setbacks").insertOne(setback);
  return setback;
}

export async function listSetbacks(
  userId: string,
  limit = 50
): Promise<Setback[]> {
  const db = await getDb();
  return db
    .collection<Setback>("setbacks")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
