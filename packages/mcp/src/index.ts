import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLinkeGringoMcpServer } from './server.js';

export { createLinkeGringoMcpServer } from './server.js';
export * from './cdp/probe.js';
export * from './cdp/types.js';

async function main() {
  const server = createLinkeGringoMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[LinkeGringo MCP] Servidor iniciado com sucesso via stdio.');
}

// Executa apenas se chamado diretamente como CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error('[LinkeGringo MCP] Erro fatal na inicialização:', err);
    process.exit(1);
  });
}
