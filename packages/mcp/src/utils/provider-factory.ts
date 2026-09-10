import type { AiProvider } from '@linkegringo/core';
import { createAiProvider } from '@linkegringo/ai';

export function resolveAiProvider(apiKeyOverride?: string): {
  provider: AiProvider;
  isDemo: boolean;
  message?: string;
} {
  const apiKey = (apiKeyOverride || process.env.GEMINI_API_KEY || '').trim();

  if (apiKey) {
    return {
      provider: createAiProvider('gemini', { apiKey }),
      isDemo: false,
    };
  }

  return {
    provider: createAiProvider('demo'),
    isDemo: true,
    message:
      'GEMINI_API_KEY não configurada. Executando em Modo Demonstração (Demo). Para usar o Gemini real, defina a variável GEMINI_API_KEY no cliente MCP.',
  };
}
