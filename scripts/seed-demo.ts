/**
 * Idempotent pitch demo accounts with rich sample data.
 * Recoverer: phoenix_demo / AnchorDemo1!
 * Companion: care_demo / AnchorDemo1!
 */
import { MongoClient } from "mongodb";
import { config } from "dotenv";
import { resolve } from "path";
import bcrypt from "bcryptjs";

config({ path: resolve(process.cwd(), ".env.local") });
config();

const PASSWORD = "AnchorDemo1!";

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || "anchor_dev";
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db(dbName);
  const now = new Date();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const recovererId = "usr_pitch_phoenix";
  const companionId = "usr_pitch_care";
  const profileId = "rp_pitch_phoenix";

  const recoverer = {
    _id: recovererId,
    username: "phoenix_demo",
    email: "phoenix.demo@anchor.app",
    passwordHash,
    alias: "Phoenix",
    role: "recoverer",
    mode: "recovery",
    onboardingCompleted: true,
    isDemo: true,
    sharedOverview: {
      triggers: ["Work stress", "Loneliness", "Poor sleep"],
      copingStrategies: ["Walking", "Breathing", "Talking to someone"],
      motivations: ["Family", "Health"],
      note: "Pitch demo recoverer — labelled demo data.",
    },
    linkedRecovererIds: [companionId],
    createdAt: now,
    updatedAt: now,
  };

  const companion = {
    _id: companionId,
    username: "care_demo",
    email: "care.demo@anchor.app",
    passwordHash,
    alias: "SupportiveSibling",
    role: "companion",
    mode: "companion",
    onboardingCompleted: true,
    isDemo: true,
    linkedRecovererIds: [recovererId],
    createdAt: now,
    updatedAt: now,
  };

  await db.collection("users").updateOne(
    { _id: recovererId as never },
    { $set: recoverer },
    { upsert: true }
  );
  await db.collection("users").updateOne(
    { _id: companionId as never },
    { $set: companion },
    { upsert: true }
  );

  await db.collection("recoveryProfiles").updateOne(
    { _id: profileId as never },
    {
      $set: {
        _id: profileId,
        userId: recovererId,
        triggers: ["Work stress", "Loneliness", "Poor sleep"],
        copingStrategies: ["Walking", "Breathing", "Talking to someone"],
        motivations: ["Family", "Health"],
        motivationCustom: "I want to be present for my family.",
        safeContacts: [{ name: "Arun", relationship: "Brother" }],
        preferences: {},
        createdAt: now,
        updatedAt: now,
      },
    },
    { upsert: true }
  );

  // Clear prior pitch sample docs then reinsert (idempotent shape)
  await db.collection("checkins").deleteMany({ userId: recovererId });
  await db.collection("interventions").deleteMany({ userId: recovererId });
  await db.collection("setbacks").deleteMany({ userId: recovererId });
  await db.collection("preventionPlans").deleteMany({ userId: recovererId });
  await db.collection("chatSessions").deleteMany({ userId: recovererId });
  await db.collection("supportPosts").deleteMany({
    _id: { $in: ["post_pitch_1", "post_pitch_2"] as never[] },
  });
  await db.collection("companionLinks").deleteMany({
    _id: "link_pitch_demo" as never,
  });

  const daysAgo = (d: number) => new Date(Date.now() - d * 86400000);

  await db.collection("checkins").insertMany([
    {
      _id: "chk_pitch_1",
      userId: recovererId,
      state: "good",
      createdAt: daysAgo(1),
    },
    {
      _id: "chk_pitch_2",
      userId: recovererId,
      state: "struggling",
      trigger: "Work",
      createdAt: daysAgo(2),
    },
    {
      _id: "chk_pitch_3",
      userId: recovererId,
      state: "a_little_off",
      trigger: "Lonely",
      createdAt: daysAgo(4),
    },
  ] as never[]);

  await db.collection("interventions").insertMany([
    {
      _id: "int_pitch_1",
      userId: recovererId,
      entryReason: "urge",
      initialIntensity: 5,
      recommendedTool: "urge_surf",
      acknowledgement: "I'm here.",
      steps: [{ type: "instruction", text: "Breathe." }],
      completedSteps: [0],
      outcome: "much_better",
      finalIntensity: 2,
      createdAt: daysAgo(2),
      completedAt: daysAgo(2),
    },
    {
      _id: "int_pitch_2",
      userId: recovererId,
      entryReason: "calm_down",
      initialIntensity: 4,
      recommendedTool: "ground_me",
      acknowledgement: "Let's slow down.",
      steps: [{ type: "breathing", text: "In for 4." }],
      completedSteps: [0],
      outcome: "a_little_better",
      finalIntensity: 2,
      createdAt: daysAgo(5),
      completedAt: daysAgo(5),
    },
    {
      _id: "int_pitch_3",
      userId: recovererId,
      entryReason: "urge",
      initialIntensity: 3,
      recommendedTool: "change_environment",
      steps: [{ type: "action", text: "Move rooms." }],
      completedSteps: [0],
      outcome: "about_the_same",
      finalIntensity: 3,
      createdAt: daysAgo(8),
      completedAt: daysAgo(8),
    },
  ] as never[]);

  await db.collection("setbacks").insertOne({
    _id: "sb_pitch_1",
    userId: recovererId,
    precedingTrigger: "Work stress",
    urgePresent: "yes",
    possibleHelpfulAction: "Opening Anchor earlier",
    createdAt: daysAgo(6),
  } as never);

  await db.collection("preventionPlans").insertOne({
    _id: "plan_pitch_1",
    userId: recovererId,
    situation: "Stressful workday",
    generatedPlan: {
      before: ["Eat beforehand", "Tell Arun the plan", "Decide an exit time"],
      ifDifficult: ["Step outside", "Open Anchor", "Try walking"],
      exitPlan: ["Call Arun", "Leave early"],
      rememberWhy: "Family",
    },
    createdAt: daysAgo(3),
  } as never);

  await db.collection("chatSessions").insertOne({
    _id: "chat_pitch_1",
    userId: recovererId,
    messages: [
      {
        role: "user",
        content: "Work was brutal and the urge is loud.",
        createdAt: daysAgo(2),
      },
      {
        role: "assistant",
        content:
          "I'm here, Phoenix. You don't have to explain everything. Let's take the next two minutes — breathe out longer than you breathe in.",
        createdAt: daysAgo(2),
      },
    ],
    distressLevel: 4,
    summary: "Evening work stress raised urge intensity; grounding helped.",
    createdAt: daysAgo(2),
    updatedAt: daysAgo(2),
  } as never);

  await db.collection("supportPosts").insertMany([
    {
      _id: "post_pitch_1",
      authorUserId: recovererId,
      authorAlias: "Phoenix",
      overview: recoverer.sharedOverview,
      content:
        "Having a hard evening after work. Could use a human voice — not advice, just presence.",
      status: "answered",
      targetCompanionId: null,
      isGeneral: true,
      replies: [
        {
          _id: "rpl_pitch_1",
          companionUserId: companionId,
          companionAlias: "SupportiveSibling",
          content:
            "I'm here with you. You don't have to handle this alone. Want to take three breaths together and tell me one thing that feels doable?",
          createdAt: daysAgo(1),
        },
        {
          _id: "rpl_pitch_1b",
          companionUserId: companionId,
          companionAlias: "SupportiveSibling",
          content: "Proud of you for asking. Checking in again in a bit.",
          createdAt: daysAgo(1),
        },
      ],
      createdAt: daysAgo(1),
      updatedAt: daysAgo(1),
    },
    {
      _id: "post_pitch_2",
      authorUserId: recovererId,
      authorAlias: "Phoenix",
      overview: recoverer.sharedOverview,
      content: "Lonely tonight. The urge isn't gone but I'm trying to ride it.",
      status: "answered",
      targetCompanionId: null,
      isGeneral: true,
      replies: [
        {
          _id: "rpl_pitch_2",
          companionUserId: companionId,
          companionAlias: "SupportiveSibling",
          content:
            "Riding it counts. Try a short walk or open the Anchor timer — I'll stay on this thread.",
          createdAt: daysAgo(3),
        },
      ],
      createdAt: daysAgo(3),
      updatedAt: daysAgo(3),
    },
  ] as never[]);

  await db.collection("companionLinks").updateOne(
    { _id: "link_pitch_demo" as never },
    {
      $set: {
        _id: "link_pitch_demo",
        recovererUserId: recovererId,
        companionUserId: companionId,
        recovererUsername: "phoenix_demo",
        companionUsername: "care_demo",
        createdAt: now,
      },
    },
    { upsert: true }
  );

  console.log("Pitch demo accounts ready:");
  console.log("  Recoverer  phoenix_demo / AnchorDemo1!");
  console.log("  Companion  care_demo / AnchorDemo1!");
  await client.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
