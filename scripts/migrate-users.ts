import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI required");
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB_NAME || "anchor_dev");

  try {
    await db.collection("users").dropIndex("username_1");
  } catch {
    // ignore
  }

  const legacy = await db
    .collection("users")
    .find({ $or: [{ username: { $exists: false } }, { username: null }] })
    .toArray();

  for (const u of legacy) {
    await db.collection("users").updateOne(
      { _id: u._id },
      {
        $set: {
          username: `legacy_${String(u._id).slice(-8)}`,
          role: u.mode === "companion" ? "companion" : "recoverer",
        },
      }
    );
  }

  console.log(`Migrated ${legacy.length} legacy users.`);
  await client.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
