import type { CopingTool, EntryReason, InterventionStep } from "@/types";
import type { InterventionAi } from "@/lib/ai/schemas";

const TOOL_BY_REASON: Record<EntryReason, CopingTool> = {
  urge: "urge_surf",
  calm_down: "ground_me",
  leave_situation: "change_environment",
  cant_explain: "cant_explain_flow",
  urgent_help: "urgent",
  timer: "timer_surf",
  ai_chat: "ai_chat",
};

export function fallbackIntervention(
  entryReason: EntryReason,
  motivations: string[] = []
): InterventionAi {
  const tool = TOOL_BY_REASON[entryReason];
  const why = motivations[0] ?? "what matters to you";

  const flows: Record<CopingTool, InterventionStep[]> = {
    urge_surf: [
      {
        type: "instruction",
        text: "I'm here. You don't need to explain everything.",
      },
      {
        type: "instruction",
        text: "Notice the urge like a wave. You don't have to act on it right now.",
      },
      {
        type: "breathing",
        text: "Breathe in for 4. Hold for 4. Out for 6. Do this three times.",
      },
      {
        type: "action",
        text: "Name one thing you can do for the next two minutes instead of acting on the urge.",
      },
    ],
    ground_me: [
      { type: "instruction", text: "Let's slow this down together." },
      {
        type: "instruction",
        text: "Feel your feet on the floor. Press them gently.",
      },
      {
        type: "breathing",
        text: "Inhale slowly through your nose. Exhale longer than you inhale.",
      },
      {
        type: "choice",
        text: "What helps a little right now?",
        options: ["Water", "Step outside", "Music", "Sit quietly"],
      },
    ],
    change_environment: [
      {
        type: "choice",
        text: "Is the trigger around you?",
        options: ["Yes", "No", "Not sure"],
      },
      {
        type: "instruction",
        text: "If you can, take your phone and move somewhere different. I'll stay with you.",
      },
      {
        type: "action",
        text: "When you're somewhere else, tap continue.",
      },
    ],
    remind_me_why: [
      {
        type: "instruction",
        text: `Remember why. ${why}.`,
      },
      {
        type: "instruction",
        text: "You chose recovery for a reason. One moment at a time is enough.",
      },
      { type: "action", text: "Keep going for the next few minutes." },
    ],
    reach_someone: [
      {
        type: "instruction",
        text: "You don't have to handle this alone.",
      },
      {
        type: "choice",
        text: "What feels doable?",
        options: ["Call a safe person", "Draft a message", "Not right now"],
      },
    ],
    cant_explain_flow: [
      {
        type: "instruction",
        text: "That's okay. You don't have to explain.",
      },
      {
        type: "choice",
        text: "Can you move somewhere you feel safer?",
        options: ["Yes", "No", "I'm not sure"],
      },
      {
        type: "breathing",
        text: "If you can, take three slow breaths with me.",
      },
      {
        type: "instruction",
        text: "I'm still here. One next step is enough.",
      },
    ],
    urgent: [
      {
        type: "instruction",
        text: "Your safety matters. Let's get real-world support options.",
      },
    ],
    timer_surf: [
      {
        type: "instruction",
        text: "We'll ride this urge for a few minutes together.",
      },
      {
        type: "timer",
        text: "Stay with your breath until the timer ends. Tap if the urge spikes.",
      },
      {
        type: "instruction",
        text: "You stayed. That is enough for now.",
      },
    ],
    ai_chat: [
      {
        type: "instruction",
        text: "You can talk to me in the chat. I'm listening.",
      },
    ],
  };

  const schemaTool =
    tool === "urgent" || tool === "timer_surf" || tool === "ai_chat"
      ? tool === "ai_chat"
        ? "ground_me"
        : "urge_surf"
      : tool;

  return {
    riskLevel: entryReason === "urgent_help" ? "urgent" : "elevated",
    acknowledgement: "I'm here. Let's take this one step at a time.",
    recommendedTool: schemaTool,
    steps: flows[tool === "urgent" ? "ground_me" : tool],
    suggestContact: entryReason === "urge" || entryReason === "urgent_help",
    resourceTags: ["coping", "cravings"],
  };
}
