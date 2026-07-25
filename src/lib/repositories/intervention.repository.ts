import { getDb } from "@/lib/db/mongodb";
import type {
  CopingTool,
  EntryReason,
  Intervention,
  InterventionOutcome,
  InterventionStep,
} from "@/types";
import { newId } from "@/lib/session";

export async function createIntervention(input: {
  userId: string;
  entryReason: EntryReason;
  initialIntensity?: number;
  context?: string;
  recommendedTool: CopingTool;
  acknowledgement?: string;
  steps: InterventionStep[];
  riskLevel?: string;
}): Promise<Intervention> {
  const intervention: Intervention = {
    _id: newId("int"),
    userId: input.userId,
    entryReason: input.entryReason,
    initialIntensity: input.initialIntensity,
    context: input.context,
    recommendedTool: input.recommendedTool,
    acknowledgement: input.acknowledgement,
    steps: input.steps,
    completedSteps: [],
    riskLevel: input.riskLevel,
    createdAt: new Date(),
  };
  const db = await getDb();
  await db.collection<Intervention>("interventions").insertOne(intervention);
  return intervention;
}

export async function findInterventionById(
  id: string
): Promise<Intervention | null> {
  const db = await getDb();
  return db.collection<Intervention>("interventions").findOne({ _id: id });
}

export async function markStepComplete(
  id: string,
  stepIndex: number
): Promise<Intervention | null> {
  const db = await getDb();
  const existing = await findInterventionById(id);
  if (!existing) return null;
  if (existing.completedSteps.includes(stepIndex)) return existing;
  return db.collection<Intervention>("interventions").findOneAndUpdate(
    { _id: id },
    { $push: { completedSteps: stepIndex } },
    { returnDocument: "after" }
  );
}

export async function completeIntervention(
  id: string,
  outcome: InterventionOutcome,
  finalIntensity?: number
): Promise<Intervention | null> {
  const db = await getDb();
  return db.collection<Intervention>("interventions").findOneAndUpdate(
    { _id: id },
    {
      $set: {
        outcome,
        finalIntensity,
        completedAt: new Date(),
      },
    },
    { returnDocument: "after" }
  );
}

export async function listInterventions(
  userId: string,
  limit = 50
): Promise<Intervention[]> {
  const db = await getDb();
  return db
    .collection<Intervention>("interventions")
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function listCompletedInterventions(
  userId: string,
  limit = 100
): Promise<Intervention[]> {
  const db = await getDb();
  return db
    .collection<Intervention>("interventions")
    .find({ userId, completedAt: { $exists: true } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}
