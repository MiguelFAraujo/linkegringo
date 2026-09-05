import type { AiProvider, AiProviderConfig } from '@linkegringo/core';
import { GeminiAiProvider } from './providers/gemini.js';
import { DemoAiProvider } from './providers/mock.js';

export interface ProviderDescriptor {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
}

export interface RemoteGeminiModel {
  id: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  badge?: string;
}

export interface GeminiModelOption {
  id: string;
  name: string;
  badge?: string;
  description: string;
}

export function assignGeminiModelBadge(id: string): string | undefined {
  if (
    id.startsWith('gemini-3.6') ||
    id.startsWith('gemini-3.5') ||
    id === 'gemini-2.5-flash'
  ) {
    return 'Recomendado';
  }
  if (id.includes('preview') || id.includes('experimental') || id.includes('-exp')) {
    return 'Experimental';
  }
  if (id.startsWith('gemini-1.5') || id.startsWith('gemini-2.5') || id.startsWith('gemini-3')) {
    return 'Estável';
  }
  if (id.startsWith('gemini-2.0')) {
    return 'Legado';
  }
  return undefined;
}

export function getModelSortWeight(id: string): number {
  if (id === 'gemini-3.6-flash') return 1200;
  if (id.startsWith('gemini-3.6-flash')) return 1190;
  if (id === 'gemini-3.5-flash') return 1150;
  if (id.startsWith('gemini-3.5-flash')) return 1140;
  if (id.startsWith('gemini-3')) return 1100;
  if (id === 'gemini-2.5-flash') return 1000;
  if (id.startsWith('gemini-2.5-flash')) return 990;
  if (id === 'gemini-2.5-pro') return 950;
  if (id.startsWith('gemini-2.5-pro')) return 940;
  if (id === 'gemini-1.5-flash') return 800;
  if (id.startsWith('gemini-1.5-flash-8b')) return 770;
  if (id.startsWith('gemini-1.5-flash')) return 780;
  if (id === 'gemini-1.5-pro') return 750;
  if (id.startsWith('gemini-1.5-pro')) return 740;
  if (id === 'gemini-2.0-flash') return 200; // Deprecated by Google
  if (id.startsWith('gemini-2.0')) return 190;

  let weight = 0;
  if (id.startsWith('gemini-3')) weight += 600;
  else if (id.startsWith('gemini-2.5')) weight += 500;
  else if (id.startsWith('gemini-1.5')) weight += 300;
  else if (id.startsWith('gemini-2.0')) weight += 100;
  else if (id.startsWith('gemini-1.0')) weight += 50;

  if (id.includes('flash')) weight += 50;
  if (id.includes('pro')) weight += 30;
  if (!id.includes('preview') && !id.includes('exp')) weight += 10;
  return weight;
}

export async function fetchGeminiModels(apiKey: string): Promise<RemoteGeminiModel[]> {
  const trimmedKey = apiKey ? apiKey.trim() : '';
  if (!trimmedKey) {
    throw new Error('Chave de API do Gemini não informada.');
  }

  const allRawModels: any[] = [];
  let pageToken: string | undefined = undefined;
  let pageCount = 0;
  const maxPages = 5;

  do {
    pageCount++;
    const pageParam = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '';
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(trimmedKey)}&pageSize=100${pageParam}`;
    const response = await fetch(url);

    if (!response.ok) {
      let detail = '';
      try {
        const errJson = await response.json();
        detail = errJson?.error?.message || errJson?.error?.status || '';
      } catch {
        detail = await response.text().catch(() => '');
      }
      throw new Error(
        `Falha ao buscar modelos do Google Gemini (${response.status}): ${detail || response.statusText}`,
      );
    }

    const data = (await response.json()) as { models?: any[]; nextPageToken?: string };
    if (Array.isArray(data?.models)) {
      allRawModels.push(...data.models);
    }

    pageToken =
      data?.nextPageToken && typeof data.nextPageToken === 'string'
        ? data.nextPageToken
        : undefined;
  } while (pageToken && pageCount < maxPages);

  const seenIds = new Set<string>();
  const filtered = allRawModels.filter((m) => {
    const methods: string[] = Array.isArray(m.supportedGenerationMethods)
      ? m.supportedGenerationMethods
      : [];
    if (!methods.includes('generateContent')) {
      return false;
    }

    const rawName: string = typeof m.name === 'string' ? m.name : '';
    const cleanId = rawName.replace(/^models\//, '');
    if (!cleanId.startsWith('gemini-') || seenIds.has(cleanId)) {
      return false;
    }
    seenIds.add(cleanId);
    return true;
  });

  const models: RemoteGeminiModel[] = filtered.map((m) => {
    const rawName: string = typeof m.name === 'string' ? m.name : '';
    const cleanId = rawName.replace(/^models\//, '');
    return {
      id: cleanId,
      displayName: m.displayName || cleanId,
      description: m.description || '',
      supportedGenerationMethods: m.supportedGenerationMethods || [],
      inputTokenLimit: typeof m.inputTokenLimit === 'number' ? m.inputTokenLimit : undefined,
      outputTokenLimit: typeof m.outputTokenLimit === 'number' ? m.outputTokenLimit : undefined,
      badge: assignGeminiModelBadge(cleanId),
    };
  });

  models.sort((a, b) => {
    const diff = getModelSortWeight(b.id) - getModelSortWeight(a.id);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });

  return models;
}

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const AVAILABLE_GEMINI_MODELS: GeminiModelOption[] = [
  {
    id: 'gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    badge: 'Recomendado • Alta Velocidade',
    description: 'Raciocínio avançado, suporte multimodal nativo a PDFs e alta performance.',
  },
  {
    id: 'gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    badge: 'Estável',
    description: 'Modelo clássico de alta velocidade e ampla compatibilidade.',
  },
  {
    id: 'gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    badge: 'Capacidade Estendida',
    description: 'Janela de contexto ultra ampla para perfis extensos e múltiplos documentos.',
  },
];

export const AVAILABLE_PROVIDERS: ProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (Recomendado)',
    description: 'Usa a API gratuita oficial do Google Gemini com fallback automático e suporte multimodal nativo.',
    requiresApiKey: true,
  },
  {
    id: 'demo',
    name: 'Modo Demonstração (Offline)',
    description: 'Teste o fluxo completo imediatamente com dados mock sem precisar de nenhuma chave de API.',
    requiresApiKey: false,
  },
];

export function getAvailableProviders(): ProviderDescriptor[] {
  return AVAILABLE_PROVIDERS;
}

export function createAiProvider(
  providerId: string = 'gemini',
  config: AiProviderConfig = {},
): AiProvider {
  switch (providerId) {
    case 'gemini': {
      const apiKey = (config.apiKey as string) || '';
      const rawModel = (config.model as string) || '';
      const model = rawModel && rawModel !== 'gemini-2.0-flash' ? rawModel : DEFAULT_GEMINI_MODEL;
      return new GeminiAiProvider({
        apiKey,
        model,
        retryDelayMs: config.retryDelayMs as number | undefined,
      });
    }
    case 'demo': {
      return new DemoAiProvider();
    }
    default:
      throw new Error(`Provedor de IA desconhecido: "${providerId}"`);
  }
}


