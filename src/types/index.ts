export type UserRole = "recoverer" | "companion";

/** @deprecated use UserRole — kept for older records */
export type UserMode = "recovery" | "companion" | UserRole;

export type CheckinState =
  | "good"
  | "a_little_off"
  | "struggling"
  | "need_support";

export type InterventionOutcome =
  | "much_better"
  | "a_little_better"
  | "about_the_same"
  | "worse";

export type EntryReason =
  | "urge"
  | "calm_down"
  | "leave_situation"
  | "cant_explain"
  | "urgent_help"
  | "timer"
  | "ai_chat";

export type CopingTool =
  | "urge_surf"
  | "ground_me"
  | "change_environment"
  | "remind_me_why"
  | "reach_someone"
  | "cant_explain_flow"
  | "urgent"
  | "timer_surf"
  | "ai_chat";

export interface SafeContact {
  name: string;
  relationship: string;
  phone?: string;
}

export interface User {
  _id: string;
  /** Public handle companions can link to */
  username: string;
  email?: string | null;
  passwordHash?: string | null;
  alias: string | null;
  role: UserRole;
  /** legacy field */
  mode?: UserMode;
  onboardingCompleted: boolean;
  isDemo: boolean;
  /** Recoverer overview shared with linked companions */
  sharedOverview?: {
    triggers: string[];
    copingStrategies: string[];
    motivations: string[];
    note?: string;
  };
  linkedRecovererIds?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RecoveryProfile {
  _id: string;
  userId: string;
  triggers: string[];
  copingStrategies: string[];
  motivations: string[];
  motivationCustom?: string;
  safeContacts: SafeContact[];
  preferences: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Checkin {
  _id: string;
  userId: string;
  state: CheckinState;
  trigger?: string;
  intensity?: number;
  createdAt: Date;
}

export interface InterventionStep {
  type: "instruction" | "choice" | "breathing" | "timer" | "action";
  text: string;
  options?: string[];
}

export interface Intervention {
  _id: string;
  userId: string;
  entryReason: EntryReason;
  initialIntensity?: number;
  context?: string;
  recommendedTool: CopingTool;
  acknowledgement?: string;
  steps: InterventionStep[];
  completedSteps: number[];
  outcome?: InterventionOutcome;
  finalIntensity?: number;
  riskLevel?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface Setback {
  _id: string;
  userId: string;
  precedingTrigger: string;
  urgePresent: "yes" | "no" | "dont_remember";
  possibleHelpfulAction: string;
  notes?: string;
  createdAt: Date;
}

export interface PreventionPlan {
  _id: string;
  userId: string;
  situation: string;
  generatedPlan: {
    before: string[];
    ifDifficult: string[];
    exitPlan: string[];
    rememberWhy: string;
  };
  createdAt: Date;
}

export interface Resource {
  _id: string;
  title: string;
  category: string;
  summary: string;
  content: string;
  sourceName: string;
  sourceUrl: string;
  tags: string[];
  verified: boolean;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface ChatSession {
  _id: string;
  userId: string;
  messages: ChatMessage[];
  distressLevel?: number;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type SupportPostStatus = "open" | "answered" | "closed";

export interface SupportReply {
  _id: string;
  companionUserId: string;
  companionAlias: string;
  content: string;
  createdAt: Date;
}

export interface SupportPost {
  _id: string;
  authorUserId: string;
  /** Never show real identity — public-facing alias only */
  authorAlias: string;
  overview: {
    triggers: string[];
    copingStrategies: string[];
    motivations: string[];
    note?: string;
  };
  content: string;
  status: SupportPostStatus;
  /** If set, only linked companions of this recoverer see it preferentially — still on general board when general=true */
  targetCompanionId?: string | null;
  isGeneral: boolean;
  replies: SupportReply[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CompanionLink {
  _id: string;
  recovererUserId: string;
  companionUserId: string;
  recovererUsername: string;
  companionUsername: string;
  createdAt: Date;
}

export interface ApiSuccess<T> {
  success: true;
  data: T;
}

export interface ApiFailure {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
