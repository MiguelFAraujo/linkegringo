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
import {
  parseAndDiagnoseSchema as geminiParseAndDiagnoseSchema,
  interviewPlanSchema as geminiInterviewPlanSchema,
  interviewProgressSchema as geminiInterviewProgressSchema,
  rewrittenProfileSchema as geminiRewrittenProfileSchema,
} from '../schemas.js';

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

export const FALSE_BENCHMARK_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  {
    pattern: /(?:é\s+)?um dos melhores resumos (?:já )?avaliados[,\s.]*/gi,
    replacement: 'Resumo técnico com estrutura clara. ',
  },
  {
    pattern: /(?:é\s+)?um dos melhores perfis (?:já )?(?:vistos|avaliados)[,\s.]*/gi,
    replacement: 'Perfil com forte alinhamento técnico. ',
  },
  {
    pattern: /top\s+\d+[%％]\s*(?:dos candidatos|da base)?[,\s.]*/gi,
    replacement: 'Alinhado aos padrões internacionais. ',
  },
  {
    pattern: /melhor que a m[eé]dia[,\s.]*/gi,
    replacement: 'Cumpre os requisitos técnicos. ',
  },
  {
    pattern: /melhor do que a maioria[,\s.]*/gi,
    replacement: 'Cumpre os requisitos técnicos. ',
  },
  {
    pattern: /resumo exemplar entre os candidatos analisados[,\s.]*/gi,
    replacement: 'Resumo objetivo com bom direcionamento técnico. ',
  },
  {
    pattern: /entre os melhores da base[,\s.]*/gi,
    replacement: 'Cumpre os requisitos técnicos. ',
  },
];

export function scrubFalseBenchmarks(text: string): string {
  if (!text) return text;
  let result = text;
  for (const { pattern, replacement } of FALSE_BENCHMARK_PATTERNS) {
    result = result.replace(pattern, replacement);
  }
  return result.trim().replace(/\s{2,}/g, ' ');
}

export function scrubEmojis(text: string): string {
  if (!text) return text;
  return text
    .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1F02F}\u{1F0A0}-\u{1F0FF}\u{1F100}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, '')
    .trim();
}

export function sanitizeReviewBenchmarks(review: ProfileReview): ProfileReview {
  const artifactRegex = /artefato.*pdf|quebra.*par[aá]grafo|linha.*corrida|falta de quebra|espa[çc]amento.*resumo/i;

  const cleanScoreExplanations = review.scoreExplanations
    ? {
        searchRelevance: scrubEmojis(scrubFalseBenchmarks(review.scoreExplanations.searchRelevance || '')),
        humanVoice: scrubEmojis(scrubFalseBenchmarks(review.scoreExplanations.humanVoice || '')),
        credibility: scrubEmojis(scrubFalseBenchmarks(review.scoreExplanations.credibility || '')),
        positioningClarity: scrubEmojis(scrubFalseBenchmarks(review.scoreExplanations.positioningClarity || '')),
        evidenceCoverage: scrubEmojis(scrubFalseBenchmarks(review.scoreExplanations.evidenceCoverage || '')),
      }
    : undefined;

  return {
    ...review,
    executiveSummary: scrubEmojis(scrubFalseBenchmarks(review.executiveSummary)),
    scoreExplanations: cleanScoreExplanations,
    critique: (review.critique || []).map((c) => {
      const filteredIssues = (c.issues || []).filter((issue) => !artifactRegex.test(issue));
      const cleanIssues = filteredIssues
        .map(scrubFalseBenchmarks)
        .map(scrubEmojis)
        .filter(Boolean);
      const cleanStrengths = (c.strengths || [])
        .map(scrubFalseBenchmarks)
        .map(scrubEmojis)
        .filter(Boolean);
      const cleanAssessment = scrubEmojis(scrubFalseBenchmarks(c.assessment));

      return {
        ...c,
        assessment: cleanAssessment,
        strengths: cleanStrengths,
        issues: cleanIssues,
        severity: cleanIssues.length === 0 ? ('low' as const) : c.severity,
      };
    }),
  };
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

export interface GeminiProviderOptions {
  apiKey: string;
  model?: string;
  retryDelayMs?: number;
}

export function isTransientOrHighDemandError(err: any): boolean {
  if (!err) return false;
  const str = String(
    err?.message || err?.statusText || err?.status || (typeof err === 'string' ? err : ''),
  ).toLowerCase();
  const code = Number(err?.status || err?.code || err?.error?.code);
  return (
    code === 503 ||
    code === 429 ||
    str.includes('503') ||
    str.includes('429') ||
    str.includes('high demand') ||
    str.includes('unavailable') ||
    str.includes('temporarily') ||
    str.includes('overloaded') ||
    str.includes('spikes in demand') ||
    str.includes('resource has been exhausted') ||
    str.includes('quota') ||
    str.includes('rate limit')
  );
}

export function isAuthError(err: any): boolean {
  if (!err) return false;
  const str = String(
    err?.message || err?.statusText || err?.status || (typeof err === 'string' ? err : ''),
  ).toLowerCase();
  const code = Number(err?.status || err?.code || err?.error?.code);
  return (
    code === 401 ||
    code === 403 ||
    str.includes('api_key_invalid') ||
    str.includes('api key not valid') ||
    str.includes('invalid api key') ||
    str.includes('permission_denied')
  );
}

export function getFallbackModels(primaryModel: string): string[] {
  const defaults = ['gemini-3.5-flash', 'gemini-3.6-flash', 'gemini-3.7-flash', 'gemini-3.8-flash'];
  const list = [primaryModel, ...defaults].filter((m) => /^gemini-3\.[5-8]-flash/.test(m));
  return Array.from(new Set(list));
}

export class GeminiAiProvider implements AiProvider {
  readonly id = 'gemini';
  private ai: GoogleGenAI;
  private model: string;
  private retryDelayMs: number;

  constructor(config: GeminiProviderOptions) {
    if (!config.apiKey) {
      throw new Error('Chave de API do Gemini não informada.');
    }
    this.ai = new GoogleGenAI({ apiKey: config.apiKey });
    this.model =
      config.model && /^gemini-3\.[5-8]-flash/.test(config.model)
        ? config.model
        : 'gemini-3.5-flash';
    this.retryDelayMs = typeof config.retryDelayMs === 'number' ? config.retryDelayMs : 1500;
  }

  get name(): string {
    return `Google Gemini (${this.model})`;
  }

  getModel(): string {
    return this.model;
  }

  private async executeGenerateContent(params: {
    contents: any;
    config?: any;
  }): Promise<any> {
    const candidateModels = getFallbackModels(this.model);
    const maxRetriesPerModel = 2; // Up to 3 attempts per model
    let lastError: any = null;

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const candidate = candidateModels[mIdx];

      for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model: candidate,
            contents: params.contents,
            config: params.config,
          });

          // If a contingency model succeeded, keep it as active model for subsequent calls
          if (candidate !== this.model) {
            console.info(
              `[GeminiAiProvider] Modelo de contingência "${candidate}" respondeu com sucesso. Mantendo este modelo para os próximos passos.`,
            );
            this.model = candidate;
          }

          return response;
        } catch (err: any) {
          lastError = err;

          if (isAuthError(err)) {
            throw new Error(
              'Chave de API do Gemini inválida ou sem permissão. Verifique sua chave no Google AI Studio (aistudio.google.com).',
            );
          }

          // Check if Google returned 404 / deprecated model error
          const is404 =
            err?.status === 404 ||
            err?.code === 404 ||
            Number(err?.error?.code) === 404 ||
            String(err?.message || '').toLowerCase().includes('404') ||
            String(err?.message || '').toLowerCase().includes('no longer available') ||
            String(err?.message || '').toLowerCase().includes('not_found');

          if (is404) {
            console.warn(
              `[GeminiAiProvider] Modelo "${candidate}" não está disponível ou foi descontinuado pela Google (404 Not Found). Alternando para o próximo modelo...`,
            );
            // Skip retrying this model, break inner loop to try next candidate model!
            break;
          }

          if (!isTransientOrHighDemandError(err)) {
            throw err;
          }

          console.warn(
            `[GeminiAiProvider] Erro transitório / alta demanda no modelo "${candidate}" (tentativa ${attempt + 1}/${maxRetriesPerModel + 1}):`,
            err?.message || err,
          );

          if (attempt < maxRetriesPerModel) {
            const delay = this.retryDelayMs * Math.pow(2, attempt) + Math.random() * 300;
            await new Promise((resolve) => setTimeout(resolve, delay));
            continue;
          }

          if (mIdx < candidateModels.length - 1) {
            const nextCandidate = candidateModels[mIdx + 1];
            console.warn(
              `[GeminiAiProvider] Modelo "${candidate}" sobrecarregado após tentativas. Alternando automaticamente para contingência "${nextCandidate}"...`,
            );
          }
        }
      }
    }

    const detailMsg = lastError?.message || lastError?.status || '503 Service Unavailable';
    throw new Error(
      `Os servidores do Google Gemini estão sob alta demanda temporária (erro 503/429).\n` +
      `Tentamos automaticamente os modelos ${candidateModels.join(', ')}, mas todos relataram sobrecarga momentânea.\n` +
      `Detalhe da Google: ${detailMsg}\n\n` +
      `Por favor, aguarde alguns instantes e clique para tentar novamente.`
    );
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await this.executeGenerateContent({
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
    targetRole?: string;
    currentDate?: string;
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
      text: buildParseAndDiagnosePrompt(input.pdfText, input.currentDate, input.targetRole),
    });

    const response = await this.executeGenerateContent({
      contents: parts,
      config: {
        systemInstruction: PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiParseAndDiagnoseSchema,
        temperature: 0.1,
      },
    });

    const rawJson = extractJsonFromResponse<{ profile: unknown; review: unknown }>(response.text || '{}');
    const profile = profileSchema.parse(rawJson.profile);
    const rawReview = profileReviewSchema.parse(rawJson.review);
    const review = sanitizeReviewBenchmarks(rawReview);

    return { profile, review };
  }

  async generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
    review?: ProfileReview;
    currentDate?: string;
  }): Promise<InterviewPlan> {
    const prompt = buildInterviewPrompt(input.profile, input.objective, input.currentDate, input.review);
    const response = await this.executeGenerateContent({
      contents: prompt,
      config: {
        systemInstruction: INTERVIEW_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiInterviewPlanSchema,
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
    roundNumber?: number;
    currentDate?: string;
  }): Promise<InterviewProgress> {
    const prompt = buildInterviewProgressPrompt(
      input.profile,
      input.objective,
      input.plan,
      input.answers,
      input.previousFacts,
      input.roundNumber,
      input.currentDate,
    );

    const response = await this.executeGenerateContent({
      contents: prompt,
      config: {
        systemInstruction: INTERVIEW_PROGRESS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiInterviewProgressSchema,
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
    currentDate?: string;
  }): Promise<ProfileAnalysis> {
    const prompt = buildRewriteProfilePrompt(
      input.profile,
      input.objective,
      input.confirmedFacts,
      input.initialReview,
      input.currentDate,
    );

    const response = await this.executeGenerateContent({
      contents: prompt,
      config: {
        systemInstruction: REWRITE_PROFILE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiRewrittenProfileSchema,
        temperature: 0.1,
      },
    });

    let rawJson = extractJsonFromResponse<any>(response.text || '{}');

    // Strictly sanitize all em-dashes and en-dashes across all rewritten content, critique, and summaries
    rawJson = deepSanitizeDashes(rawJson);

    return profileAnalysisSchema.parse(rawJson);
  }
}
