import type { Resource } from "../src/types";

export const SEED_RESOURCES: Resource[] = [
  {
    _id: "res_urges_samhsa",
    title: "Understanding cravings and urges",
    category: "understanding urges",
    summary:
      "Cravings are common in recovery and often pass. Learning to ride them out is a core coping skill.",
    content:
      "Urges can feel intense and temporary. Grounding, changing environment, and reaching support are practical responses. Anchor does not replace clinical care.",
    sourceName: "SAMHSA",
    sourceUrl: "https://www.samhsa.gov/find-help/recovery",
    tags: ["cravings", "coping", "urges"],
    verified: true,
  },
  {
    _id: "res_triggers",
    title: "Recognizing triggers",
    category: "understanding triggers",
    summary:
      "Triggers can be people, places, feelings, or times of day. Naming them helps prevention planning.",
    content:
      "Awareness of personal triggers supports prevention without shame. Use Prepare Me before high-risk situations.",
    sourceName: "SAMHSA",
    sourceUrl: "https://www.samhsa.gov/find-help/recovery",
    tags: ["triggers", "prevention"],
    verified: true,
  },
  {
    _id: "res_coping",
    title: "Coping strategies that help",
    category: "coping strategies",
    summary:
      "Walking, breathing, talking to someone, and changing your environment are practical short-term tools.",
    content:
      "Effective coping is personal. Track what actually helps you in Recovery Memory.",
    sourceName: "SAMHSA",
    sourceUrl: "https://www.samhsa.gov/find-help/recovery",
    tags: ["coping", "grounding"],
    verified: true,
  },
  {
    _id: "res_setbacks",
    title: "Setbacks are part of recovery",
    category: "setbacks",
    summary:
      "Recovery can include setbacks. They are information for learning, not proof of failure.",
    content:
      "SAMHSA describes recovery as highly personal and involving continual growth and management of setbacks.",
    sourceName: "SAMHSA",
    sourceUrl: "https://www.samhsa.gov/find-help/recovery",
    tags: ["setbacks", "recovery"],
    verified: true,
  },
  {
    _id: "res_supporting",
    title: "Supporting someone you care about",
    category: "supporting someone",
    summary:
      "Listen, avoid shame, and encourage professional help when needed — without monitoring their private recovery.",
    content:
      "Companions can offer presence and practical support. Surveillance damages trust.",
    sourceName: "SAMHSA",
    sourceUrl: "https://www.samhsa.gov/families",
    tags: ["supporting-someone", "families"],
    verified: true,
  },
  {
    _id: "res_professional",
    title: "Find professional treatment support",
    category: "professional support",
    summary:
      "SAMHSA National Helpline: 1-800-662-HELP (4357) — free, confidential, 24/7.",
    content:
      "Use verified directories for treatment referrals. Anchor is not a crisis or medical service.",
    sourceName: "SAMHSA National Helpline",
    sourceUrl: "https://www.samhsa.gov/find-help/national-helpline",
    tags: ["professional-support", "helpline"],
    verified: true,
  },
  {
    _id: "res_emergency",
    title: "Crisis and emergency resources",
    category: "emergency resources",
    summary:
      "If you are in immediate danger, contact local emergency services. In the US, 988 provides 24/7 crisis support.",
    content:
      "Emergency numbers vary by country. Prefer local emergency services and verified crisis lines over AI-invented contacts.",
    sourceName: "988 Lifeline",
    sourceUrl: "https://988lifeline.org/",
    tags: ["emergency", "crisis", "professional-support"],
    verified: true,
  },
];
