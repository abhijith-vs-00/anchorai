import { getDb } from "@/lib/db/mongodb";
import type { Resource } from "@/types";

export async function listResources(filters?: {
  category?: string;
  tags?: string[];
}): Promise<Resource[]> {
  const db = await getDb();
  const query: Record<string, unknown> = { verified: true };
  if (filters?.category) query.category = filters.category;
  if (filters?.tags?.length) query.tags = { $in: filters.tags };
  return db.collection<Resource>("resources").find(query).toArray();
}

export async function findResourcesByTags(tags: string[]): Promise<Resource[]> {
  if (!tags.length) return [];
  const db = await getDb();
  return db
    .collection<Resource>("resources")
    .find({ verified: true, tags: { $in: tags } })
    .limit(5)
    .toArray();
}

export async function upsertResources(resources: Resource[]): Promise<number> {
  const db = await getDb();
  let count = 0;
  for (const resource of resources) {
    await db.collection<Resource>("resources").updateOne(
      { _id: resource._id },
      { $set: resource },
      { upsert: true }
    );
    count += 1;
  }
  return count;
}
