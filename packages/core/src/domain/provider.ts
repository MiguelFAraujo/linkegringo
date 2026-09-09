import type { Profile } from './profile.js';
import type {
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
} from './interview.js';
import type { ProfileAnalysis, ProfileReview } from './analysis.js';

export interface ParseAndDiagnoseInput {
  pdfBase64?: string;
  pdfText?: string;
  cvPdfBase64?: string;
  targetRole?: string;
  currentDate?: string;
  chatHistory?: unknown[];
}

export interface ParseAndDiagnoseResult {
  profile: Profile;
  review: ProfileReview;
}

export interface AiProviderConfig {
  apiKey?: string;
  model?: string;
  [key: string]: unknown;
}

export interface AiProvider {
  readonly id: string;
  readonly name: string;

  testConnection(): Promise<boolean>;

  /**
   * Consolidated initial parsing and diagnostic review in a single unified turn.
   */
  parseAndDiagnose(input: ParseAndDiagnoseInput): Promise<ParseAndDiagnoseResult>;

  /**
   * @deprecated Legacy parsing method. Maintained for backwards compatibility during migration.
   */
  parseProfile?(input: {
    pdfText: string;
    currentDate?: string;
  }): Promise<Profile>;

  /**
   * @deprecated Legacy diagnostic method. Maintained for backwards compatibility during migration.
   */
  diagnoseProfile?(input: {
    profile: Profile;
    targetRole?: string;
    currentDate?: string;
  }): Promise<ProfileReview>;

  generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
    review?: ProfileReview;
    currentDate?: string;
  }): Promise<InterviewPlan>;

  evaluateProgress(input: {
    profile: Profile;
    objective: CareerObjective;
    plan: InterviewPlan;
    answers: InterviewAnswer[];
    previousFacts: ConfirmedFact[];
    roundNumber?: number;
    currentDate?: string;
  }): Promise<InterviewProgress>;

  generateRewrittenProfile(input: {
    profile: Profile;
    objective: CareerObjective;
    confirmedFacts: ConfirmedFact[];
    initialReview?: ProfileReview;
    currentDate?: string;
    interviewAnswers?: InterviewAnswer[];
  }): Promise<ProfileAnalysis>;

  getChatHistory?(): unknown[];
  restoreChatHistory?(history: unknown[]): void;
}
