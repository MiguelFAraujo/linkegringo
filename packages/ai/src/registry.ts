import type { AiProvider, AiProviderConfig } from '@linkegringo/core';
import { GeminiAiProvider } from './providers/gemini.js';
import { DemoAiProvider } from './providers/mock.js';

export interface ProviderDescriptor {
  id: string;
  name: string;
  description: string;
  requiresApiKey: boolean;
}

export const AVAILABLE_PROVIDERS: ProviderDescriptor[] = [
  {
    id: 'gemini',
    name: 'Google Gemini (Recomendado)',
    description: 'Usa a API gratuita oficial do Google Gemini 2.5 Flash com suporte multimodal nativo.',
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
      return new GeminiAiProvider({
        apiKey,
        model: (config.model as string) || 'gemini-2.5-flash',
      });
    }
    case 'demo': {
      return new DemoAiProvider();
    }
    default:
      throw new Error(`Provedor de IA desconhecido: "${providerId}"`);
  }
}
