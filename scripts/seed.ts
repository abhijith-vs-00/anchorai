import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { resolve } from "path";
import { SEED_RESOURCES } from "./seed-data";

config({ path: resolve(process.cwd(), ".env.local") });
config();

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "anchor_dev";
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const col = db.collection("resources");

    for (const resource of SEED_RESOURCES) {
      await col.updateOne({ _id: resource._id as never }, { $set: resource }, { upsert: true });
    }

    await db.collection("users").createIndex({ createdAt: -1 });
    await db.collection("users").createIndex(
      { username: 1 },
      { unique: true, sparse: true }
    );
    await db.collection("users").createIndex({ email: 1 }, { sparse: true });
    await db.collection("checkins").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("interventions").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("setbacks").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("preventionPlans").createIndex({ userId: 1, createdAt: -1 });
    await db.collection("recoveryProfiles").createIndex({ userId: 1 }, { unique: true });
    await db.collection("resources").createIndex({ tags: 1 });
    await db.collection("resources").createIndex({ category: 1 });
    await db.collection("supportPosts").createIndex({ createdAt: -1 });
    await db.collection("supportPosts").createIndex({ authorUserId: 1, createdAt: -1 });
    await db.collection("companionLinks").createIndex(
      { recovererUserId: 1, companionUserId: 1 },
      { unique: true }
    );
    await db.collection("chatSessions").createIndex({ userId: 1, updatedAt: -1 });

    console.log(
      `Seeded ${SEED_RESOURCES.length} resources into ${dbName} (idempotent).`
    );
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
