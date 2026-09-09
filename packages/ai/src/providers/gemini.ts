import { GoogleGenAI, type Chat, type Content, type Part } from '@google/genai';
import type {
  AiProvider,
  CareerObjective,
  ConfirmedFact,
  InterviewAnswer,
  InterviewPlan,
  InterviewProgress,
  ParseAndDiagnoseInput,
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
  buildDiagnoseProfilePrompt,
  buildInterviewProgressPrompt,
  buildInterviewPrompt,
  buildParseAndDiagnosePrompt,
  buildParseProfilePrompt,
  buildRewriteProfilePrompt,
  DIAGNOSE_PROFILE_SYSTEM_PROMPT,
  INTERVIEW_PROGRESS_SYSTEM_PROMPT,
  INTERVIEW_SYSTEM_PROMPT,
  PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
  PARSE_PROFILE_SYSTEM_PROMPT,
  REWRITE_PROFILE_SYSTEM_PROMPT,
} from '../prompts.js';
import {
  geminiDiagnoseProfileSchema,
  geminiInterviewPlanSchema,
  geminiInterviewProgressSchema,
  geminiParseAndDiagnoseSchema,
  geminiParseProfileSchema,
  geminiRewrittenProfileSchema,
} from '../schemas.js';

export function enforceExperienceRecovery(
  originalExperiences: Array<{ companyName: string; title?: string; description?: string }>,
  rewrittenExperiences: Array<{ companyName: string; title: string; bullets: string[] }>,
): Array<{ companyName: string; title: string; bullets: string[] }> {
  const rewrittenCompanies = new Set(
    rewrittenExperiences.map((e) => (e.companyName || '').trim().toLowerCase()),
  );
  const recovered = [...rewrittenExperiences];

  for (const orig of originalExperiences) {
    if (!orig || !orig.companyName || !orig.companyName.trim()) continue;
    const key = orig.companyName.trim().toLowerCase();
    if (!rewrittenCompanies.has(key)) {
      const bullets = orig.description
        ? orig.description
            .split('\n')
            .map((l) => l.trim())
            .filter((l) => l.length > 0)
        : [];
      recovered.push({
        companyName: orig.companyName.trim(),
        title: orig.title || 'Senior Software Engineer',
        bullets:
          bullets.length > 0
            ? bullets
            : [`Delivered software engineering initiatives at ${orig.companyName.trim()}.`],
      });
      rewrittenCompanies.add(key);
    }
  }

  return recovered;
}

export function cleanBase64(data?: string): string {
  if (!data || typeof data !== 'string') return '';
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
    .replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu, '')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

export function deepScrubEmojis<T>(val: T): T {
  if (typeof val === 'string') {
    return scrubEmojis(val) as unknown as T;
  }
  if (Array.isArray(val)) {
    return val.map(deepScrubEmojis) as unknown as T;
  }
  if (val !== null && typeof val === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      res[k] = deepScrubEmojis(v);
    }
    return res as unknown as T;
  }
  return val;
}

export function sanitizeReviewBenchmarks(review: ProfileReview): ProfileReview {
  const artifactRegex =
    /artefato.*pdf|quebra.*par[aá]grafo|linha.*corrida|falta de quebra|espa[çc]amento.*resumo|poucas compet[êe]ncias|poucas skills|apenas \d+ skills|expandir.*compet[êe]ncias formais|basta documentar forma[çc][õo]es acad[êe]micas|cursos formais na se[çc][ãa]o/i;

  const academicDemandRegex =
    /\.?\s*Para atingir 100%,?\s*(?:basta|pode)\s*documentar\s*forma[çc][õo]es\s*acad[êe]micas.*$/i;
  const skillsExpansionRegex =
    /\.?\s*Para atingir 100%,?\s*(?:basta|pode)\s*expandir\s*a\s*lista\s*de\s*compet[êe]ncias\s*formais.*$/i;

  const sanitizeExplanationText = (text: string) => {
    let clean = scrubEmojis(scrubFalseBenchmarks(text || ''));
    clean = clean.replace(academicDemandRegex, '. Cumpre integralmente os requisitos de credibilidade técnica.');
    clean = clean.replace(skillsExpansionRegex, '. Termos técnicos centrais devidamente indexados no perfil.');
    return clean.replace(/\s{2,}/g, ' ').trim();
  };

  const cleanScoreExplanations = review.scoreExplanations
    ? {
        searchRelevance: sanitizeExplanationText(review.scoreExplanations.searchRelevance || ''),
        humanVoice: sanitizeExplanationText(review.scoreExplanations.humanVoice || ''),
        credibility: sanitizeExplanationText(review.scoreExplanations.credibility || ''),
        positioningClarity: sanitizeExplanationText(review.scoreExplanations.positioningClarity || ''),
        evidenceCoverage: sanitizeExplanationText(review.scoreExplanations.evidenceCoverage || ''),
      }
    : undefined;

  return {
    ...review,
    overallScore: review.overallScore,
    scores: { ...review.scores },
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

export function ensureFormattedSummary(summary: string): string {
  if (!summary) return summary;
  let text = summary.trim();

  // If already formatted with double newlines, return as is
  if (text.includes('\n\n')) {
    return text;
  }

  // If formatted with single newlines, expand to double newlines for clear paragraph breathing
  if (text.includes('\n')) {
    return text.replace(/\n(?!\n)/g, '\n\n');
  }

  // If output as a single continuous block without any \n, insert paragraph breaks
  // before common section headings and bullet patterns
  text = text.replace(/(Core Languages|Languages & Frameworks|Technologies|Tech Stack|Architecture & Patterns|Distributed Systems|Cloud, DevOps|Cloud & Infrastructure|Databases & Queues|Key Competencies):/gi, '\n\n$1:');
  text = text.replace(/([.!?])\s+(•|[-*]|\b(?:Architected|Engineered|Spearheaded|Leading|Currently|Available for|Open to)\b)/g, '$1\n\n$2');

  return text;
}

export class GeminiAiProvider implements AiProvider {
  readonly id = 'gemini';
  private ai: GoogleGenAI;
  private model: string;
  private retryDelayMs: number;
  private chat: Chat | null = null;
  private chatHistory: Content[] = [];

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

  getChatHistory(): unknown[] {
    if (this.chat && typeof this.chat.getHistory === 'function') {
      return this.chat.getHistory();
    }
    return this.chatHistory;
  }

  restoreChatHistory(history: unknown[]): void {
    if (Array.isArray(history)) {
      this.chatHistory = history as Content[];
      this.chat = this.ai.chats.create({
        model: this.model,
        history: this.chatHistory,
        config: {
          temperature: 0.1,
          thinkingConfig: { thinkingBudget: 2048 },
          ...( { thinkingBudget: 2048 } as any ),
        },
      });
    }
  }

  private async executeChatMessage(params: {
    message: string | Part | (string | Part)[];
    config?: any;
  }): Promise<any> {
    const candidateModels = getFallbackModels(this.model);
    const maxRetriesPerModel = 2; // Up to 3 attempts per model
    let lastError: any = null;

    const mergedConfig = {
      temperature: 0.1,
      thinkingConfig: {
        thinkingBudget: 2048,
      },
      thinkingBudget: 2048 as any,
      ...params.config,
    };

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const candidate = candidateModels[mIdx];

      // If no active chat session or migrating to fallback model, re-instantiate chat with existing history
      if (!this.chat || this.model !== candidate) {
        const existingHistory = (this.getChatHistory() as Content[]) || [];
        this.model = candidate;
        this.chat = this.ai.chats.create({
          model: candidate,
          history: existingHistory.length > 0 ? existingHistory : undefined,
          config: mergedConfig,
        });
      }

      for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
        try {
          const response = await this.chat.sendMessage({
            message: params.message,
            config: mergedConfig,
          });

          // If a contingency model succeeded, keep it as active model for subsequent calls
          if (candidate !== candidateModels[0]) {
            console.info(
              `[GeminiAiProvider] Modelo de contingência "${candidate}" respondeu com sucesso. Mantendo este modelo para os próximos passos.`,
            );
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

  private async executeGenerateContent(params: {
    contents: any;
    config?: any;
  }): Promise<any> {
    const candidateModels = getFallbackModels(this.model);
    const maxRetriesPerModel = 2; // Up to 3 attempts per model
    let lastError: any = null;

    const mergedConfig = {
      ...params.config,
      thinkingConfig: {
        thinkingBudget: 2048,
        ...params.config?.thinkingConfig,
      },
    };

    for (let mIdx = 0; mIdx < candidateModels.length; mIdx++) {
      const candidate = candidateModels[mIdx];

      for (let attempt = 0; attempt <= maxRetriesPerModel; attempt++) {
        try {
          const response = await this.ai.models.generateContent({
            model: candidate,
            contents: params.contents,
            config: mergedConfig,
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

  async parseAndDiagnose(input: ParseAndDiagnoseInput): Promise<ParseAndDiagnoseResult> {
    const initialConfig = {
      thinkingBudget: 2048 as any,
      thinkingConfig: { thinkingBudget: 2048 },
      temperature: 0.1,
      responseSchema: geminiParseAndDiagnoseSchema,
      responseMimeType: 'application/json',
      systemInstruction: PARSE_AND_DIAGNOSE_SYSTEM_PROMPT,
    };

    // Initialize chat session using specified configuration
    this.chat = this.ai.chats.create({
      model: this.model,
      history: (input.chatHistory as any) || [],
      config: initialConfig,
    });

    const messageParts: (string | Part)[] = [];
    if (input.pdfBase64) {
      messageParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64(input.pdfBase64),
        },
      });
    }
    if (input.cvPdfBase64) {
      messageParts.push({
        inlineData: {
          mimeType: 'application/pdf',
          data: cleanBase64(input.cvPdfBase64),
        },
      });
    }

    const promptText = buildParseAndDiagnosePrompt(input.pdfText, input.currentDate, input.targetRole);
    messageParts.push({ text: promptText });

    const response = await this.executeChatMessage({
      message: messageParts,
      config: initialConfig,
    });

    const rawJson = extractJsonFromResponse<{ reasoning?: unknown; profile?: unknown; review?: unknown }>(
      response.text || '{}',
    );
    const profilePayload = rawJson.profile ?? rawJson;
    const reviewPayload = rawJson.review ?? rawJson;

    const scrubbedProfile = deepScrubEmojis(profilePayload);
    const parsedProfile = profileSchema.parse(scrubbedProfile);

    const scrubbedReview = deepScrubEmojis(reviewPayload);
    const parsedReview = profileReviewSchema.parse(scrubbedReview);
    const sanitizedReview = sanitizeReviewBenchmarks(parsedReview);

    return {
      profile: parsedProfile,
      review: sanitizedReview,
    };
  }

  async parseProfile(input: {
    pdfText: string;
    currentDate?: string;
  }): Promise<Profile> {
    const prompt = buildParseProfilePrompt(input.pdfText, input.currentDate);

    const response = await this.executeGenerateContent({
      contents: prompt,
      config: {
        systemInstruction: PARSE_PROFILE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiParseProfileSchema,
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    });

    const rawJson = extractJsonFromResponse<{ reasoning?: unknown; profile?: unknown }>(
      response.text || '{}',
    );
    const profilePayload = rawJson.profile ?? rawJson;
    const scrubbedJson = deepScrubEmojis(profilePayload);
    return profileSchema.parse(scrubbedJson);
  }

  async diagnoseProfile(input: {
    profile: Profile;
    targetRole?: string;
    currentDate?: string;
  }): Promise<ProfileReview> {
    const prompt = buildDiagnoseProfilePrompt(input.profile, input.currentDate, input.targetRole);

    const response = await this.executeGenerateContent({
      contents: prompt,
      config: {
        systemInstruction: DIAGNOSE_PROFILE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiDiagnoseProfileSchema,
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
      },
    });

    const rawJson = extractJsonFromResponse<{ reasoning?: unknown; review?: unknown }>(
      response.text || '{}',
    );
    const reviewPayload = rawJson.review ?? rawJson;
    const scrubbedJson = deepScrubEmojis(reviewPayload);
    const rawReview = profileReviewSchema.parse(scrubbedJson);
    return sanitizeReviewBenchmarks(rawReview);
  }

  async generateInterview(input: {
    profile: Profile;
    objective: CareerObjective;
    review?: ProfileReview;
    currentDate?: string;
  }): Promise<InterviewPlan> {
    const prompt = buildInterviewPrompt(input.profile, input.objective, input.currentDate, input.review);
    const response = await this.executeChatMessage({
      message: prompt,
      config: {
        systemInstruction: INTERVIEW_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiInterviewPlanSchema,
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
        thinkingBudget: 2048 as any,
      },
    });

    const rawJson = extractJsonFromResponse<any>(response.text || '{}');
    const questions = rawJson.questions ?? (Array.isArray(rawJson) ? rawJson : []);
    const scrubbedJson = deepScrubEmojis({ questions });
    return interviewPlanSchema.parse(scrubbedJson);
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

    const response = await this.executeChatMessage({
      message: prompt,
      config: {
        systemInstruction: INTERVIEW_PROGRESS_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiInterviewProgressSchema,
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
        thinkingBudget: 2048 as any,
      },
    });

    const rawJson = extractJsonFromResponse<any>(response.text || '{}');
    const progressPayload = rawJson.progress ?? rawJson;
    const scrubbedJson = deepScrubEmojis(progressPayload);
    return interviewProgressSchema.parse(scrubbedJson);
  }

  async generateRewrittenProfile(input: {
    profile: Profile;
    objective: CareerObjective;
    confirmedFacts: ConfirmedFact[];
    initialReview?: ProfileReview;
    currentDate?: string;
    interviewAnswers?: InterviewAnswer[];
  }): Promise<ProfileAnalysis> {
    const prompt = buildRewriteProfilePrompt(
      input.profile,
      input.objective,
      input.confirmedFacts,
      input.initialReview,
      input.currentDate,
      input.interviewAnswers,
    );

    const response = await this.executeChatMessage({
      message: prompt,
      config: {
        systemInstruction: REWRITE_PROFILE_SYSTEM_PROMPT,
        responseMimeType: 'application/json',
        responseSchema: geminiRewrittenProfileSchema,
        temperature: 0.1,
        thinkingConfig: {
          thinkingBudget: 2048,
        },
        thinkingBudget: 2048 as any,
      },
    });

    let rawJson = extractJsonFromResponse<any>(response.text || '{}');
    const analysisPayload = rawJson.analysis ?? rawJson;

    // Strictly sanitize all em-dashes and en-dashes across all rewritten content, critique, and summaries
    let sanitized = deepSanitizeDashes(analysisPayload);
    // Strictly scrub any emoji artifacts across all rewritten content
    sanitized = deepScrubEmojis(sanitized);

    // Format summary paragraphs with clean line breaks
    if (sanitized?.rewritten?.summary) {
      sanitized.rewritten.summary = ensureFormattedSummary(sanitized.rewritten.summary);
    }

    // Non-Regression Guard 1: Invariant N -> N (preserve and recover any missing original companies)
    if (input.profile?.experiences && Array.isArray(sanitized?.rewritten?.experiences)) {
      sanitized.rewritten.experiences = enforceExperienceRecovery(
        input.profile.experiences,
        sanitized.rewritten.experiences,
      );
    }

    // Non-Regression Guard 2: Score Monotonicity (Scores_final >= Scores_initial)
    if (input.initialReview?.scores && sanitized?.scores) {
      const initScores = input.initialReview.scores;
      sanitized.scores = {
        searchRelevance: Math.max(sanitized.scores.searchRelevance ?? 0, initScores.searchRelevance ?? 0),
        humanVoice: Math.max(sanitized.scores.humanVoice ?? 0, initScores.humanVoice ?? 0),
        credibility: Math.max(sanitized.scores.credibility ?? 0, initScores.credibility ?? 0),
        positioningClarity: Math.max(sanitized.scores.positioningClarity ?? 0, initScores.positioningClarity ?? 0),
        evidenceCoverage: Math.max(sanitized.scores.evidenceCoverage ?? 0, initScores.evidenceCoverage ?? 0),
      };

      if (typeof input.initialReview.overallScore === 'number') {
        sanitized.overallScore = Math.max(sanitized.overallScore ?? 0, input.initialReview.overallScore);
      }
    }

    // Preserve triageBottlenecks from initial review if not populated
    if (!sanitized.triageBottlenecks || sanitized.triageBottlenecks.length === 0) {
      if (input.initialReview?.triageBottlenecks) {
        sanitized.triageBottlenecks = [...input.initialReview.triageBottlenecks];
      }
    }

    return profileAnalysisSchema.parse(sanitized);
  }
}
