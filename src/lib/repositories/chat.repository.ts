import { getDb } from "@/lib/db/mongodb";
import type { ChatMessage, ChatSession } from "@/types";
import { newId } from "@/lib/session";

export async function createChatSession(userId: string): Promise<ChatSession> {
  const now = new Date();
  const session: ChatSession = {
    _id: newId("chat"),
    userId,
    messages: [],
    createdAt: now,
    updatedAt: now,
  };
  const db = await getDb();
  await db.collection<ChatSession>("chatSessions").insertOne(session);
  return session;
}

export async function findChatSession(id: string): Promise<ChatSession | null> {
  const db = await getDb();
  return db.collection<ChatSession>("chatSessions").findOne({ _id: id });
}

export async function appendChatMessages(
  id: string,
  messages: ChatMessage[],
  meta?: { distressLevel?: number; summary?: string }
): Promise<ChatSession | null> {
  const db = await getDb();
  const set: Record<string, unknown> = { updatedAt: new Date() };
  if (meta?.distressLevel != null) set.distressLevel = meta.distressLevel;
  if (meta?.summary) set.summary = meta.summary;
  return db.collection<ChatSession>("chatSessions").findOneAndUpdate(
    { _id: id },
    {
      $push: { messages: { $each: messages } },
      $set: set,
    },
    { returnDocument: "after" }
  );
}

export async function listChatSessions(
  userId: string,
  limit = 30
): Promise<ChatSession[]> {
  const db = await getDb();
  return db
    .collection<ChatSession>("chatSessions")
    .find({ userId })
    .sort({ updatedAt: -1 })
    .limit(limit)
    .toArray();
}
