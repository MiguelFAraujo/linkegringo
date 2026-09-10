import { z } from 'zod';
import { resolveAiProvider } from '../utils/provider-factory.js';

export function formatGoogleXyzBullet(parts: {
  action: string;
  metric: string;
  method: string;
}): string {
  return `${parts.action}, measured by ${parts.metric}, by ${parts.method}.`;
}

export const convertToXyzBulletInputSchema = z.object({
  rawBullet: z
    .string()
    .describe('Bullet original descritivo ou passivo (ex: "Desenvolvi microsserviços em Go para pagamentos")'),
  roleContext: z
    .string()
    .default('Senior Software Engineer')
    .describe('Contexto da empresa, cargo ou projeto (ex: "Fintech de pagamentos, alta escala")'),
  metricsOrHints: z
    .string()
    .optional()
    .describe('Métricas reais ou pistas numéricas (ex: "20M req/dia, latência caiu 45%, SLA 99.99%")'),
  apiKey: z.string().optional().describe('Chave opcional do Gemini'),
});

export type ConvertToXyzBulletInput = z.infer<
  typeof convertToXyzBulletInputSchema
>;

export async function handleConvertToXyzBullet(input: ConvertToXyzBulletInput) {
  const { provider, isDemo } = resolveAiProvider(input.apiKey);

  let formattedBullet: string;

  if (isDemo) {
    formattedBullet = formatGoogleXyzBullet({
      action: 'Architected and deployed distributed services',
      metric: input.metricsOrHints || 'reducing p99 latency by 35% and scaling throughput to 10k+ RPS',
      method: `leveraging ${input.roleContext || 'modern distributed architecture and robust observability'}`,
    });
  } else {
    // Reescrita inteligente via Gemini AiProvider
    const prompt = `
Transform this passive resume bullet into a high-impact Google XYZ bullet ("Accomplished [X], measured by [Y], by doing [Z]") in English:
- Original Bullet: "${input.rawBullet}"
- Role / Company Context: "${input.roleContext}"
- Numerical Hints / Metrics: "${input.metricsOrHints || 'Include realistic engineering scale metrics like latency, throughput, cost, or reliability'}"

Rules:
1. Start with a strong active past-tense engineering verb (e.g., Architected, Engineered, Optimized, Automated).
2. Follow strict Google XYZ structure.
3. No buzzwords (avoid "passionate", "synergy", "rockstar").
4. Output ONLY the single resulting bullet without quotation marks.
`.trim();

    try {
      const chat = (provider as any).ai?.chats?.create?.({
        model: 'gemini-2.5-flash',
        config: { temperature: 0.2 },
      });
      if (chat) {
        const res = await chat.sendMessage({ message: prompt });
        formattedBullet = res.text.trim();
      } else {
        formattedBullet = formatGoogleXyzBullet({
          action: 'Engineered high-throughput production services',
          metric: input.metricsOrHints || 'improving reliability to 99.99% uptime',
          method: `by redesigning core workflows for ${input.roleContext}`,
        });
      }
    } catch {
      formattedBullet = formatGoogleXyzBullet({
        action: 'Engineered high-throughput production services',
        metric: input.metricsOrHints || 'improving reliability to 99.99% uptime',
        method: `by redesigning core workflows for ${input.roleContext}`,
      });
    }
  }

  const markdownSummary = `
# Conversão para Bullet Google XYZ

**Original**:
> "${input.rawBullet}"

**Reescrito no Formato Google XYZ**:
> ✨ **${formattedBullet}**

**Por que este formato converte**:
- **[X] Ação de Impacto**: Foco direto no que você construiu ou resolveu com verbos fortes no passado.
- **[Y] Métrica / Escala**: Dá credibilidade imediata ao demonstrar mensuração de engenharia.
- **[Z] Método / Engenharia**: Deixa claro as tecnologias e arquitetura empregadas.
`.trim();

  return {
    content: [
      {
        type: 'text' as const,
        text: markdownSummary,
      },
    ],
    structuredData: {
      originalBullet: input.rawBullet,
      formattedBullet,
      isDemo,
    },
  };
}
