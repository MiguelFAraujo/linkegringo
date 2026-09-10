import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';
import { resolveAiProvider } from '../utils/provider-factory.js';

export const auditProfileInputSchema = z.object({
  pdfPath: z
    .string()
    .optional()
    .describe('Caminho local (absoluto ou relativo) para o PDF exportado do LinkedIn'),
  pdfBase64: z
    .string()
    .optional()
    .describe('Conteúdo do arquivo PDF codificado em Base64'),
  profileText: z
    .string()
    .optional()
    .describe('Texto bruto ou extraído do perfil do LinkedIn'),
  targetRole: z
    .string()
    .default('Senior Software Engineer')
    .describe('Cargo-alvo nos EUA (ex: Senior Backend Engineer, Staff DevOps Engineer)'),
  apiKey: z
    .string()
    .optional()
    .describe('Chave opcional do Gemini para sobrepor a variável de ambiente GEMINI_API_KEY'),
});

export type AuditProfileInput = z.infer<typeof auditProfileInputSchema>;

export async function handleAuditProfile(input: AuditProfileInput) {
  let base64Content = input.pdfBase64;

  if (!base64Content && input.pdfPath) {
    const resolvedPath = path.resolve(process.cwd(), input.pdfPath);
    const fileBuffer = await fs.readFile(resolvedPath);
    base64Content = fileBuffer.toString('base64');
  }

  if (!base64Content && !input.profileText) {
    throw new Error(
      'É necessário fornecer ao menos uma fonte de dados: pdfPath, pdfBase64 ou profileText.',
    );
  }

  const { provider, isDemo, message } = resolveAiProvider(input.apiKey);

  const result = await provider.parseAndDiagnose({
    pdfBase64: base64Content,
    pdfText: input.profileText,
    targetRole: input.targetRole,
  });

  const { profile, review } = result;
  const candidateName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || 'Não identificado';
  const score = review.inboundReadiness?.score ?? review.overallScore ?? 0;
  const bottlenecks = review.triageBottlenecks || [];
  const primaryGaps = review.primaryGaps || [];

  const markdownSummary = `
# Diagnóstico de Perfil LinkeGringo

**Candidato**: ${candidateName}
**Cargo-Alvo**: ${input.targetRole}
**Nota Inbound**: **${score} / 100** ${score >= 80 ? '🟢 Recruiter-Ready' : score >= 50 ? '🟡 Competitivo Médio' : '🔴 Crítico / Baixa Indexação'}
**Modo**: ${isDemo ? 'Demonstração (Simulação Local)' : 'Google Gemini AI'}

${message ? `> ⚠️ **Aviso**: ${message}\n` : ''}

## 🚦 Gargalos de Triagem (Triage Bottlenecks)
${
  bottlenecks.length > 0
    ? bottlenecks.map((b) => `- ❌ ${b}`).join('\n')
    : '- ✓ Nenhum gargalo crítico impeditivo detectado.'
}

## 🎯 Principais Lacunas Técnicas (Gaps)
${
  primaryGaps.length > 0
    ? primaryGaps
        .map(
          (g) =>
            `- **${g.targetSection}**: ${g.label} ${g.suggestedUnlock ? `*(Sugestão: ${g.suggestedUnlock})*` : ''}`,
        )
        .join('\n')
    : '- ✓ Perfil alinhado com a stack esperada.'
}

## 📋 Resumo Estruturado
- **Headline Atual**: "${profile.headline || 'Sem headline'}"
- **Total de Experiências**: ${profile.experiences?.length || 0}
- **Top Competências**: ${profile.skills?.slice(0, 8).join(', ') || 'Nenhuma'}
`.trim();

  return {
    content: [
      {
        type: 'text' as const,
        text: markdownSummary,
      },
    ],
    structuredData: {
      profile,
      review,
      score,
      isDemo,
    },
  };
}
