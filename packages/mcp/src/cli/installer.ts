import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

export interface InstallResult {
  client: string;
  configPath: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message?: string;
}

export function getMcpConfigsForSystem(): Array<{ client: string; configPath: string }> {
  const home = os.homedir();
  const platform = os.platform();
  const configs: Array<{ client: string; configPath: string }> = [];

  // 1. Google Antigravity (Multiplataforma)
  configs.push({
    client: 'Google Antigravity',
    configPath: path.join(home, '.gemini', 'config', 'mcp_config.json'),
  });

  // 2. Claude Desktop
  if (platform === 'darwin') {
    configs.push({
      client: 'Claude Desktop (macOS)',
      configPath: path.join(
        home,
        'Library',
        'Application Support',
        'Claude',
        'claude_desktop_config.json',
      ),
    });
  } else if (platform === 'win32') {
    const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
    configs.push({
      client: 'Claude Desktop (Windows)',
      configPath: path.join(appData, 'Claude', 'claude_desktop_config.json'),
    });
  } else {
    // Linux e outros
    configs.push({
      client: 'Claude Desktop (Linux)',
      configPath: path.join(home, '.config', 'Claude', 'claude_desktop_config.json'),
    });
  }

  // 3. Cursor AI
  configs.push({
    client: 'Cursor AI',
    configPath: path.join(home, '.cursor', 'mcp.json'),
  });

  return configs;
}

export function installMcpServerConfig(configPath: string): { status: 'created' | 'updated'; path: string } {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  let configData: any = { mcpServers: {} };
  let isNew = true;

  if (fs.existsSync(configPath)) {
    try {
      const raw = fs.readFileSync(configPath, 'utf8');
      if (raw.trim()) {
        configData = JSON.parse(raw);
        isNew = false;
      }
    } catch {
      // Se estiver corrompido, inicializa estrutura válida
      configData = { mcpServers: {} };
    }
  }

  if (!configData.mcpServers || typeof configData.mcpServers !== 'object') {
    configData.mcpServers = {};
  }

  // Injeta o servidor oficial LinkeGringo (Zero API Key, local)
  configData.mcpServers['linkegringo'] = {
    command: 'npx',
    args: ['-y', '@linkegringo/mcp'],
  };

  // Injeta o servidor oficial Chrome DevTools com autoConnect
  configData.mcpServers['chrome-devtools'] = {
    command: 'npx',
    args: ['-y', 'chrome-devtools-mcp@latest', '--autoConnect'],
  };

  fs.writeFileSync(configPath, JSON.stringify(configData, null, 2) + '\n', 'utf8');

  return {
    status: isNew ? 'created' : 'updated',
    path: configPath,
  };
}

export function runInstaller(): InstallResult[] {
  console.log('\n🚀 LinkeGringo MCP - Instalador Automático');
  console.log('================================================');
  console.log('Configurando servidores em todos os clientes locais:\n');

  const targets = getMcpConfigsForSystem();
  const results: InstallResult[] = [];

  for (const target of targets) {
    try {
      const res = installMcpServerConfig(target.configPath);
      results.push({
        client: target.client,
        configPath: target.configPath,
        status: res.status,
      });
      console.log(`✅ [${target.client}]`);
      console.log(`   Arquivo: ${target.configPath} (${res.status === 'created' ? 'Criado' : 'Atualizado'})\n`);
    } catch (err: any) {
      results.push({
        client: target.client,
        configPath: target.configPath,
        status: 'error',
        message: err.message,
      });
      console.warn(`⚠️ [${target.client}] Não foi possível atualizar: ${err.message}\n`);
    }
  }

  console.log('---');
  console.log('💡 Comandos One-Line diretos para agentes de linha de comando (CLI):');
  console.log('   • Antigravity CLI: agy mcp add linkegringo npx -y @linkegringo/mcp');
  console.log('   • Codex CLI:       codex mcp add linkegringo -- npx -y @linkegringo/mcp');
  console.log('   • Claude Code CLI: claude mcp add linkegringo npx -y @linkegringo/mcp');
  console.log('   • Goose CLI:       goose configure --add-extension "npx -y @linkegringo/mcp"');
  console.log('================================================');
  console.log('🎉 Instalação concluída! Reinicie o Claude Desktop, Antigravity ou Cursor para ativar.\n');

  return results;
}
