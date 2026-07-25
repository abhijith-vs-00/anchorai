import { getDb } from "@/lib/db/mongodb";
import type { PreventionPlan } from "@/types";
import { newId } from "@/lib/session";

export async function createPlan(input: {
  userId: string;
  situation: string;
  generatedPlan: PreventionPlan["generatedPlan"];
}): Promise<PreventionPlan> {
  const plan: PreventionPlan = {
    _id: newId("plan"),
    userId: input.userId,
    situation: input.situation,
    generatedPlan: input.generatedPlan,
    createdAt: new Date(),
  };
  const db = await getDb();
  await db.collection<PreventionPlan>("preventionPlans").insertOne(plan);
  return plan;
}

export async function listPlans(userId: string): Promise<PreventionPlan[]> {
  const db = await getDb();
  return db
    .collection<PreventionPlan>("preventionPlans")
    .find({ userId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function findPlanById(id: string): Promise<PreventionPlan | null> {
  const db = await getDb();
  return db.collection<PreventionPlan>("preventionPlans").findOne({ _id: id });
}
