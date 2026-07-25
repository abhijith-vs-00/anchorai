export type SafetyLevel = "ok" | "elevated" | "urgent";

export interface SafetyResult {
  level: SafetyLevel;
  reasons: string[];
  escalate: boolean;
}

const URGENT_PATTERNS = [
  /\b(kill myself|suicide|suicidal|end my life|want to die|self[- ]?harm)\b/i,
  /\b(overdose|od on purpose)\b/i,
  /\b(going to hurt (myself|someone))\b/i,
  /\b(no reason to live)\b/i,
];

const ELEVATED_PATTERNS = [
  /\b(can't go on|cant go on|give up|hopeless)\b/i,
  /\b(relapse hard|about to use|going to use)\b/i,
];

export function classifyText(text: string | undefined | null): SafetyResult {
  if (!text || !text.trim()) {
    return { level: "ok", reasons: [], escalate: false };
  }

  const reasons: string[] = [];
  for (const pattern of URGENT_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push("urgent_language");
      return { level: "urgent", reasons, escalate: true };
    }
  }
  for (const pattern of ELEVATED_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push("elevated_distress");
    }
  }
  if (reasons.length) {
    return { level: "elevated", reasons, escalate: false };
  }
  return { level: "ok", reasons: [], escalate: false };
}

export function classifyEntryReason(
  reason: string
): SafetyResult {
  if (reason === "urgent_help") {
    return {
      level: "urgent",
      reasons: ["user_selected_urgent"],
      escalate: true,
    };
  }
  if (reason === "urge" || reason === "cant_explain") {
    return { level: "elevated", reasons: [reason], escalate: false };
  }
  return { level: "ok", reasons: [], escalate: false };
}
