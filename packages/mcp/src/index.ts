import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createLinkeGringoMcpServer } from './server.js';
import { runInstaller } from './cli/installer.js';

export { createLinkeGringoMcpServer } from './server.js';
export * from './cdp/probe.js';
export * from './cdp/types.js';
export * from './cli/installer.js';

async function main() {
  if (
    process.argv.includes('install') ||
    process.argv.includes('setup') ||
    process.argv.includes('--install')
  ) {
    runInstaller();
    return;
  }

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
