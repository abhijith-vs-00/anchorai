export const SAFETY_POLICIES = {
  neverDiagnose: true,
  neverPrescribe: true,
  neverInventEmergencyNumbers: true,
  neverClaimCrisisService: true,
  peerIsNotClinical: true,
} as const;

export const DISALLOWED_AI_CLAIMS = [
  "as an ai language model",
  "i know exactly how you feel",
  "you have failed",
  "streak lost",
  "back to day zero",
];

export function violatesWordingPolicy(text: string): boolean {
  const lower = text.toLowerCase();
  return DISALLOWED_AI_CLAIMS.some((c) => lower.includes(c));
}
