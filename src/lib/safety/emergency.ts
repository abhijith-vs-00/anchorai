export interface EmergencyOption {
  id: string;
  label: string;
  description: string;
  href?: string;
  type: "emergency" | "professional" | "trusted" | "continue";
}

/**
 * Curated options — no hallucinated numbers.
 * Local emergency numbers vary by region; we link to known directories.
 */
export const EMERGENCY_OPTIONS: EmergencyOption[] = [
  {
    id: "emergency_services",
    label: "Emergency services",
    description:
      "If you or someone else is in immediate danger, contact your local emergency number now.",
    type: "emergency",
  },
  {
    id: "samhsa",
    label: "Professional support (SAMHSA)",
    description:
      "SAMHSA National Helpline: 1-800-662-HELP (4357) — free, confidential, 24/7 treatment referral.",
    href: "https://www.samhsa.gov/find-help/national-helpline",
    type: "professional",
  },
  {
    id: "988",
    label: "988 Suicide & Crisis Lifeline",
    description:
      "In the US, call or text 988 for free 24/7 crisis support.",
    href: "https://988lifeline.org/",
    type: "professional",
  },
  {
    id: "trusted",
    label: "Contact a trusted person",
    description: "Reach someone you trust from your safe contacts if available.",
    type: "trusted",
  },
  {
    id: "continue",
    label: "Continue guided support",
    description: "Stay with Anchor for grounding and next steps.",
    type: "continue",
  },
];

export function getEmergencyOptions(): EmergencyOption[] {
  return EMERGENCY_OPTIONS;
}
