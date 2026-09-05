import { GoogleGenAI } from '@google/genai';
import type {
  AiProvider,
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
  ParseAndDiagnoseResult,
  Profile,
  ProfileAnalysis,
  ProfileReview,
} from '@linkegringo/core';
import {
  interviewPlanSchema,
  interviewProgressSchema,
  profileAnalysisSchema,
  profileReviewSchema,
  profileSchema,
} from '@linkegringo/core';
import {
  buildInterviewProgressPrompt,
  buildInterviewPrompt,
  buildParseAndDiagnosePrompt,
  buildRewriteProfilePrompt,
  INTERVIEW_PROGRESS_SYSTEM_PROMPT,
  INTERVIEW_SYSTEM_PROMPT,
  PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
  REWRITE_PROFILE_SYSTEM_PROMPT,
} from '../prompts.js';

export function cleanBase64(data: string): string {
  const commaIdx = data.indexOf(',');
  const raw =
    commaIdx !== -1 && data.slice(0, commaIdx).includes('base64')
      ? data.slice(commaIdx + 1)
      : data;
  return raw.replace(/\s+/g, '').trim();
}

export function sanitizeDashes(text: string): string {
  return text.replace(/[\u2013\u2014]/g, '-');
}

export function deepSanitizeDashes<T>(val: T): T {
  if (typeof val === 'string') {
    return sanitizeDashes(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(deepSanitizeDashes) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = deepSanitizeDashes(v);
    }
    return res as unknown as T;
  }
  return val;
}

export function extractJsonFromResponse<T = unknown>(text: string): T {
  let cleaned = text.trim();

  // 1. If wrapped in markdown code fence (```json ... ``` or ``` ... ```), extract that block first
  const fencedMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fencedMatch && fencedMatch[1]) {
    cleaned = fencedMatch[1].trim();
  }

  // 2. Find outermost JSON boundary
  const firstBrace = cleaned.indexOf('{');
  const firstBracket = cleaned.indexOf('[');
  let startIdx = 0;
  if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
    startIdx = firstBrace;
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace !== -1) {
      cleaned = cleaned.substring(startIdx, lastBrace + 1);
    }
  } else if (firstBracket !== -1) {
    startIdx = firstBracket;
    const lastBracket = cleaned.lastIndexOf(']');
    if (lastBracket !== -1) {
      cleaned = cleaned.substring(startIdx, lastBracket + 1);
    }
  }

  // 3. Remove trailing commas before } or ] which LLMs often generate
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');

  // 4. Clean invisible non-printable control characters except standard whitespace
  cleaned = cleaned.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

  return JSON.parse(cleaned) as T;
}

export class GeminiAiProvider implements AiProvider {
  readonly id = 'gemini';
  readonly name = 'Google Gemini 2.5 Flash';
  private ai: GoogleGenAI;
  private model: string;

  constructor(config: { apiKey: string; model?: string }) {
    if (!config.apiKey) {
      throw new Error('Chave de API do Gemini não informada.');
    }
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model = config.model || 'gemini-2.5-flash';
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: 'Ping. Responda apenas "OK".',
      });
      return Boolean(response.text && response.text.length > 0);
    } catch (err) {
      console.error('[GeminiAiProvider] Falha ao testar conexão:', err);
      return false;
    }
  }

  async parseAndDiagnose(input: {
    pdfBase64?: string;
    pdfText?: string;
    cvPdfBase64?: string;
  }): Promise<ParseAndDiagnoseResult> {
    const parts: any[] = [];

    if (input.pdfBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64(input.pdfBase64),
        },
      });
    }

    if (input.cvPdfBase64) {
      parts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64(input.cvPdfBase64),
        },
      });
    }

    parts.push({
      text: buildParseAndDiagnosePrompt(input.pdfText),
    });

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: parts,
      config: {
        systemInstruction: PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawJson = extractJsonFromResponse<{ profile: unknown; review: unknown }>(response.text || '{}');
    const profile = profileSchema.parse(rawJson.profile);
    const review = profileReviewSchema.parse(rawJson.review);

    return { profile, review };
  }

  async generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
  }): Promise<InterviewPlan> {
    const prompt = buildInterviewPrompt(input.profile, input.objective);
    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: INTERVIEW_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawJson = extractJsonFromResponse<unknown>(response.text || '{}');
    return interviewPlanSchema.parse(rawJson);
  }

  async evaluateProgress(input: {
    profile: Profile;
    objective: CareerObjective;
    plan: InterviewPlan;
    answers: InterviewAnswer[];
    previousFacts: ConfirmedFact[];
  }): Promise<InterviewProgress> {
    const prompt = buildInterviewProgressPrompt(
      input.profile,
      input.objective,
      input.plan,
      input.answers,
      input.previousFacts,
    );

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: INTERVIEW_PROGRESS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawJson = extractJsonFromResponse<unknown>(response.text || '{}');
    return interviewProgressSchema.parse(rawJson);
  }

  async generateRewrittenProfile(input: {
    profile: Profile;
    objective: CareerObjective;
    confirmedFacts: ConfirmedFact[];
    initialReview?: ProfileReview;
  }): Promise<ProfileAnalysis> {
    const prompt = buildRewriteProfilePrompt(
      input.profile,
      input.objective,
      input.confirmedFacts,
      input.initialReview,
    );

    const response = await this.ai.models.generateContent({
      model: this.model,
      contents: prompt,
      config: {
        systemInstruction: REWRITE_PROFILE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const rawJson = extractJsonFromResponse<any>(response.text || '{}');

    // Strictly sanitize all em-dashes and en-dashes across rewritten content
    if (rawJson?.rewritten) {
      rawJson.rewritten = deepSanitizeDashes(rawJson.rewritten);
    }

    return profileAnalysisSchema.parse(rawJson);
  }
}
