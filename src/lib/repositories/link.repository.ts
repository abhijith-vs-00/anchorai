import { getDb } from "@/lib/db/mongodb";
import type { CompanionLink } from "@/types";
import { newId } from "@/lib/session";

export async function createLink(input: {
  recovererUserId: string;
  companionUserId: string;
  recovererUsername: string;
  companionUsername: string;
}): Promise<CompanionLink> {
  const db = await getDb();
  const existing = await db.collection<CompanionLink>("companionLinks").findOne({
    recovererUserId: input.recovererUserId,
    companionUserId: input.companionUserId,
  });
  if (existing) return existing;

  const link: CompanionLink = {
    _id: newId("link"),
    ...input,
    createdAt: new Date(),
  };
  await db.collection<CompanionLink>("companionLinks").insertOne(link);
  return link;
}

export async function listLinksForCompanion(
  companionUserId: string
): Promise<CompanionLink[]> {
  const db = await getDb();
  return db
    .collection<CompanionLink>("companionLinks")
    .find({ companionUserId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listLinksForRecoverer(
  recovererUserId: string
): Promise<CompanionLink[]> {
  const db = await getDb();
  return db
    .collection<CompanionLink>("companionLinks")
    .find({ recovererUserId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findLink(
  recovererUserId: string,
  companionUserId: string
): Promise<CompanionLink | null> {
  const db = await getDb();
  return db.collection<CompanionLink>("companionLinks").findOne({
    recovererUserId,
    companionUserId,
  });
}
