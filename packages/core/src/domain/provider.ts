import type { Profile } from './profile.js';
import type {
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
} from './interview.js';
import type { ProfileAnalysis, ProfileReview } from './analysis.js';

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

  parseAndDiagnose(input: {
    pdfBase64?: string;
    pdfText?: string;
    cvPdfBase64?: string;
    targetRole?: string;
    currentDate?: string;
  }): Promise<ParseAndDiagnoseResult>;

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
  }): Promise<ProfileAnalysis>;
}
