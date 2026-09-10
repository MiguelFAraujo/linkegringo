import { z } from 'zod';
import { checkChromeCdp } from '../cdp/probe.js';

export const checkChromeCdpInputSchema = z.object({
  port: z
    .number()
    .default(9222)
    .describe('Porta do Chrome DevTools Protocol a ser testada (padrão 9222)'),
  host: z
    .string()
    .default('127.0.0.1')
    .describe('Host do Chrome (padrão 127.0.0.1)'),
  timeoutMs: z
    .number()
    .default(2000)
    .describe('Tempo limite em milissegundos para a conexão'),
});

export type CheckChromeCdpInput = z.infer<typeof checkChromeCdpInputSchema>;

export async function handleCheckChromeCdp(input: CheckChromeCdpInput) {
  const status = await checkChromeCdp(input.port, input.host, input.timeoutMs);

  const markdownSummary = `
# Status do Chrome Remote Debugging (CDP)

**Porta Testada**: ${status.host}:${status.port}
**Status da Conexão**: ${status.isRunning ? '🟢 Conectado e Ativo' : '🔴 Desconectado'}

${
  status.isRunning
    ? `
- **Versão do Navegador**: ${status.browser || 'Desconhecido'}
- **Versão do Protocolo DevTools**: ${status.protocolVersion || '1.3'}
- **Total de Abas Abertas**: ${status.activeTabs.length}
- **Aba do LinkeGringo**: ${
        status.linkeGringoTabFound
          ? `✓ Detectada (${status.linkeGringoTabUrl})`
          : '⚠️ Nenhuma aba do LinkeGringo aberta no momento'
      }

${
  status.activeTabs.length > 0
    ? `### Abas Encontradas:
${status.activeTabs.map((t) => `- [${t.title}](${t.url})`).join('\n')}`
    : ''
}
`
    : `
> ❌ **Motivo**: ${status.error || 'Porta fechada.'}
> 
> **Como ativar no Google Chrome (M144+)**:
> 1. Abra uma nova aba e acesse: \`chrome://inspect/#remote-debugging\`
> 2. Marque a opção para **Ativar depuração remota**.
> 3. Se estiver usando o servidor oficial DevTools MCP, configure com \`--autoConnect\`.
`
}
`.trim();

  return {
    content: [
      {
        type: 'text' as const,
        text: markdownSummary,
      },
    ],
    structuredData: status,
  };
}
