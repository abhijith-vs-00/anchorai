import { getDb } from "@/lib/db/mongodb";
import type { SupportPost, SupportReply, SupportPostStatus } from "@/types";
import { newId } from "@/lib/session";

export async function createSupportPost(input: {
  authorUserId: string;
  authorAlias: string;
  overview: SupportPost["overview"];
  content: string;
  isGeneral: boolean;
  targetCompanionId?: string | null;
}): Promise<SupportPost> {
  const now = new Date();
  const post: SupportPost = {
    _id: newId("post"),
    authorUserId: input.authorUserId,
    authorAlias: input.authorAlias,
    overview: input.overview,
    content: input.content,
    status: "open",
    targetCompanionId: input.targetCompanionId ?? null,
    isGeneral: input.isGeneral,
    replies: [],
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  await db.collection<SupportPost>("supportPosts").insertOne(post);
  return post;
}

export async function listOpenPosts(limit = 40): Promise<SupportPost[]> {
  const db = await getDb();
  return db
    .collection<SupportPost>("supportPosts")
    .find({ isGeneral: true, status: { $in: ["open", "answered"] } })
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

export async function listPostsForRecoverer(
  authorUserId: string
): Promise<SupportPost[]> {
  const db = await getDb();
  return db
    .collection<SupportPost>("supportPosts")
    .find({ authorUserId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function listPostsForLinkedRecoverers(
  recovererIds: string[]
): Promise<SupportPost[]> {
  if (!recovererIds.length) return [];
  const db = await getDb();
  return db
    .collection<SupportPost>("supportPosts")
    .find({ authorUserId: { $in: recovererIds } })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();
}

export async function findPostById(id: string): Promise<SupportPost | null> {
  const db = await getDb();
  return db.collection<SupportPost>("supportPosts").findOne({ _id: id });
}

export async function addReply(
  postId: string,
  reply: Omit<SupportReply, "_id" | "createdAt"> & { _id?: string }
): Promise<SupportPost | null> {
  const full: SupportReply = {
    _id: reply._id ?? newId("rpl"),
    companionUserId: reply.companionUserId,
    companionAlias: reply.companionAlias,
    content: reply.content,
    createdAt: new Date(),
  };
  const db = await getDb();
  return db.collection<SupportPost>("supportPosts").findOneAndUpdate(
    { _id: postId },
    {
      $push: { replies: full },
      $set: { status: "answered" as SupportPostStatus, updatedAt: new Date() },
    },
    { returnDocument: "after" }
  );
}
