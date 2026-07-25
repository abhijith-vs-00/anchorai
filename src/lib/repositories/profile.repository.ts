import { getDb } from "@/lib/db/mongodb";
import type { RecoveryProfile, SafeContact } from "@/types";
import { newId } from "@/lib/session";

export async function upsertRecoveryProfile(input: {
  userId: string;
  triggers: string[];
  copingStrategies: string[];
  motivations: string[];
  motivationCustom?: string;
  safeContacts?: SafeContact[];
}): Promise<RecoveryProfile> {
  const db = await getDb();
  const existing = await db
    .collection<RecoveryProfile>("recoveryProfiles")
    .findOne({ userId: input.userId });

  const now = new Date();
  if (existing) {
    const updated = await db
      .collection<RecoveryProfile>("recoveryProfiles")
      .findOneAndUpdate(
        { _id: existing._id },
        {
          $set: {
            triggers: input.triggers,
            copingStrategies: input.copingStrategies,
            motivations: input.motivations,
            motivationCustom: input.motivationCustom,
            safeContacts: input.safeContacts ?? existing.safeContacts,
            updatedAt: now,
          },
        },
        { returnDocument: "after" }
      );
    return updated!;
  }

  const profile: RecoveryProfile = {
    _id: newId("rp"),
    userId: input.userId,
    triggers: input.triggers,
    copingStrategies: input.copingStrategies,
    motivations: input.motivations,
    motivationCustom: input.motivationCustom,
    safeContacts: input.safeContacts ?? [],
    preferences: {},
    createdAt: now,
    updatedAt: now,
  };
  await db.collection<RecoveryProfile>("recoveryProfiles").insertOne(profile);
  return profile;
}

export async function findProfileByUserId(
  userId: string
): Promise<RecoveryProfile | null> {
  const db = await getDb();
  return db.collection<RecoveryProfile>("recoveryProfiles").findOne({ userId });
}
