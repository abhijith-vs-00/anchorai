import { getDb } from "@/lib/db/mongodb";
import type { Checkin, CheckinState } from "@/types";
import { newId } from "@/lib/session";

export async function createCheckin(input: {
  userId: string;
  state: CheckinState;
  trigger?: string;
  intensity?: number;
}): Promise<Checkin> {
  const checkin: Checkin = {
    _id: newId("chk"),
    userId: input.userId,
    state: input.state,
    trigger: input.trigger,
    intensity: input.intensity,
    createdAt: new Date(),
  };
  const db = await getDb();
  await db.collection<Checkin>("checkins").insertOne(checkin);
  return checkin;
}

export async function listCheckins(
  userId: string,
  limit = 50
): Promise<Checkin[]> {
  const db = await getDb();
  return db
    .collection<Checkin>("checkins")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function countCheckinsSince(
  userId: string,
  since: Date
): Promise<number> {
  const db = await getDb();
  return db.collection<Checkin>("checkins").countDocuments({
    userId,
    createdAt: { $gte: since },
  });
}
