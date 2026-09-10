import { useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Cpu,
  ExternalLink,
  Info,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  Terminal,
  X,
} from 'lucide-react';
import { track } from '../lib/telemetry';
import { Button } from './ui/button';

interface McpHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  geminiApiKey?: string;
}

type ClientTab = 'claude' | 'antigravity' | 'cursor' | 'codex';

export function McpHubModal({ isOpen, onClose, geminiApiKey }: McpHubModalProps) {
  const [activeClientTab, setActiveClientTab] = useState<ClientTab>('claude');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [showLegacyCommands, setShowLegacyCommands] = useState(false);

  // CDP Live Probe State
  const [cdpStatus, setCdpStatus] = useState<'idle' | 'testing' | 'connected' | 'offline'>('idle');
  const [cdpMessage, setCdpMessage] = useState<string>('');
  const [cdpTabsCount, setCdpTabsCount] = useState<number>(0);

  if (!isOpen) return null;

  const copyToClipboard = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    } catch {
      // Fallback
    }
  };

  const handleTestCdpConnection = async () => {
    setCdpStatus('testing');
    setCdpMessage('Tentando conectar em http://127.0.0.1:9222...');
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('http://127.0.0.1:9222/json/version', {
        signal: controller.signal,
        mode: 'no-cors', // O Chrome CDP pode requerer no-cors ou PNA no browser
      });
      clearTimeout(timeoutId);

      // Se a requisição retornou (mesmo opaca), a porta 9222 está aberta e ouvindo
      setCdpStatus('connected');
      setCdpMessage('Porta 9222 está respondendo ativamente! O Chrome Remote Debugging está disponível.');
      track('mcp_connection_tested', { isRunning: true, port: 9222 });
    } catch {
      setCdpStatus('offline');
      setCdpMessage(
        'Não foi possível conectar na porta 9222. Acesse chrome://inspect/#remote-debugging no seu Chrome e marque a opção para ativar a depuração remota.',
      );
      track('mcp_connection_tested', { isRunning: false, port: 9222 });
    }
  };

  const claudeConfigJson = JSON.stringify(
    {
      mcpServers: {
        linkegringo: {
          command: 'npx',
          args: ['-y', 'linkegringo-mcp'],
          env: {
            GEMINI_API_KEY: geminiApiKey || 'SUA_CHAVE_GEMINI_AQUI',
          },
        },
        'chrome-devtools': {
          command: 'npx',
          args: ['-y', 'chrome-devtools-mcp@latest', '--autoConnect'],
        },
      },
    },
    null,
    2,
  );

  const antigravityConfigJson = JSON.stringify(
    {
      mcpServers: {
        linkegringo: {
          command: 'npx',
          args: ['-y', 'linkegringo-mcp'],
          env: {
            GEMINI_API_KEY: geminiApiKey || 'SUA_CHAVE_GEMINI_AQUI',
          },
        },
      },
    },
    null,
    2,
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mcp-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-[#0B0F19] border border-[#1E293B] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E293B] bg-[#0E1424]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="mcp-modal-title" className="text-base font-semibold text-white">
                  LinkeGringo MCP & Agentes de IA
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 rounded-full">
                  BYOK • Model Context Protocol
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Conecte o LinkeGringo diretamente no Claude Desktop, Google Antigravity, Cursor AI ou Codex
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Card 1: Chrome Remote Debugging (Modern W3C / CDP Flow) */}
          <div className="p-5 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <h3 className="text-sm font-semibold text-white">
                    1. Ativação no Google Chrome (Sem Terminal!)
                  </h3>
                  <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    Chrome M144+
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  O Chrome agora possui depuração remota nativa na interface. Você não precisa fechar seu navegador nem rodar comandos no terminal!
                </p>
              </div>

              {/* Live Probe Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestCdpConnection}
                disabled={cdpStatus === 'testing'}
                className="shrink-0 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 h-8 gap-1.5"
              >
                <Radio className={`w-3.5 h-3.5 ${cdpStatus === 'testing' ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                <span>{cdpStatus === 'testing' ? 'Verificando...' : 'Testar Porta 9222'}</span>
              </Button>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-lg bg-[#0A0E1A] border border-[#1E293B]/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-300">Passo A: Acessar Configuração</span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard('chrome://inspect/#remote-debugging', 'chrome-url')}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  >
                    {copiedKey === 'chrome-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedKey === 'chrome-url' ? 'Copiado' : 'Copiar URL'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Abra uma nova aba no Chrome e cole:
                </p>
                <code className="block p-2 rounded bg-black/50 text-cyan-300 text-xs font-mono select-all">
                  chrome://inspect/#remote-debugging
                </code>
              </div>

              <div className="p-3.5 rounded-lg bg-[#0A0E1A] border border-[#1E293B]/80 space-y-2">
                <span className="text-xs font-semibold text-cyan-300">Passo B: Autorizar Sessão</span>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Marque a caixa para <strong>Ativar depuração remota</strong>. Quando seu agente de IA chamar o servidor DevTools com <code className="text-slate-200 font-mono">--autoConnect</code>, clique em <strong>Permitir</strong> no diálogo do Chrome.
                </p>
              </div>
            </div>

            {/* Probe Feedback Banner */}
            {cdpStatus !== 'idle' && (
              <div
                className={`p-3 rounded-lg text-xs flex items-start gap-2.5 border ${
                  cdpStatus === 'connected'
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                    : cdpStatus === 'testing'
                      ? 'bg-cyan-950/30 border-cyan-500/30 text-cyan-300'
                      : 'bg-amber-950/30 border-amber-500/30 text-amber-300'
                }`}
              >
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">{cdpMessage}</p>
              </div>
            )}

            {/* Collapsible Legacy Terminal Fallback */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowLegacyCommands(!showLegacyCommands)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {showLegacyCommands ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                <span>Usando Chrome antigo (&lt; 144)? Veja a inicialização por terminal</span>
              </button>

              {showLegacyCommands && (
                <div className="mt-3 p-3.5 rounded-lg bg-black/40 border border-[#1E293B] space-y-3 animate-in fade-in">
                  <p className="text-xs text-slate-400">
                    Se sua versão do Chrome não tiver a opção visual, inicie-o pelo terminal com porta de depuração:
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Linux</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            'google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_dev_linkegringo"',
                            'cmd-linux',
                          )
                        }
                        className="hover:text-white"
                      >
                        {copiedKey === 'cmd-linux' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <pre className="p-2 rounded bg-black/60 text-slate-300 text-[11px] font-mono overflow-x-auto">
                      google-chrome --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_dev_linkegringo"
                    </pre>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>macOS</span>
                      <button
                        type="button"
                        onClick={() =>
                          copyToClipboard(
                            '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_dev_linkegringo"',
                            'cmd-mac',
                          )
                        }
                        className="hover:text-white"
                      >
                        {copiedKey === 'cmd-mac' ? 'Copiado!' : 'Copiar'}
                      </button>
                    </div>
                    <pre className="p-2 rounded bg-black/60 text-slate-300 text-[11px] font-mono overflow-x-auto">
                      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir="/tmp/chrome_dev_linkegringo"
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: AI Client Setup Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">2. Configuração no seu Cliente de IA</h3>
              <span className="text-xs text-slate-400">Selecione seu aplicativo:</span>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center gap-1 p-1 rounded-lg bg-[#0F172A] border border-[#1E293B]">
              {(
                [
                  { id: 'claude', label: 'Claude Desktop' },
                  { id: 'antigravity', label: 'Google Antigravity' },
                  { id: 'cursor', label: 'Cursor AI' },
                  { id: 'codex', label: 'Goose / Codex CLI' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveClientTab(tab.id);
                    track('mcp_modal_opened', { clientTab: tab.id });
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all ${
                    activeClientTab === tab.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab Content: Claude Desktop */}
            {activeClientTab === 'claude' && (
              <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    Cole no arquivo <code className="font-mono text-cyan-300">claude_desktop_config.json</code>:
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(claudeConfigJson, 'claude-json')}
                    className="h-7 text-xs text-cyan-400 hover:text-cyan-300 gap-1"
                  >
                    {copiedKey === 'claude-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'claude-json' ? 'Copiado!' : 'Copiar Configuração'}</span>
                  </Button>
                </div>
                <pre className="p-3.5 rounded-lg bg-black/60 text-slate-300 text-xs font-mono overflow-x-auto border border-[#1E293B]">
                  {claudeConfigJson}
                </pre>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                  <span>
                    No macOS: <code className="font-mono text-slate-300">~/Library/Application Support/Claude/claude_desktop_config.json</code> | No Windows: <code className="font-mono text-slate-300">%APPDATA%\Claude\claude_desktop_config.json</code>
                  </span>
                </div>
              </div>
            )}

            {/* Tab Content: Antigravity */}
            {activeClientTab === 'antigravity' && (
              <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-300">
                    Adicione ao seu arquivo de configuração de MCP no Antigravity:
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(antigravityConfigJson, 'antigravity-json')}
                    className="h-7 text-xs text-cyan-400 hover:text-cyan-300 gap-1"
                  >
                    {copiedKey === 'antigravity-json' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'antigravity-json' ? 'Copiado!' : 'Copiar Configuração'}</span>
                  </Button>
                </div>
                <pre className="p-3.5 rounded-lg bg-black/60 text-slate-300 text-xs font-mono overflow-x-auto border border-[#1E293B]">
                  {antigravityConfigJson}
                </pre>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Com o servidor ativo, o Antigravity pode auditar currículos em PDF, gerar bullets Google XYZ e simular buscas de recrutadores diretamente em conversas locais ou em conjunto com a skill <code className="text-cyan-300 font-mono">/browser</code>.
                </p>
              </div>
            )}

            {/* Tab Content: Cursor AI */}
            {activeClientTab === 'cursor' && (
              <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] space-y-3 animate-in fade-in text-xs text-slate-300 leading-relaxed">
                <p className="font-semibold text-white">Como configurar no Cursor AI:</p>
                <ol className="list-decimal list-inside space-y-2 text-slate-400">
                  <li>Abra as configurações do Cursor (<code className="text-slate-200">Ctrl + Shift + J</code> ou <code className="text-slate-200">Cmd + Shift + J</code>).</li>
                  <li>Navegue até <strong>Features</strong> &gt; <strong>MCP Servers</strong> e clique em <strong>+ Add New MCP Server</strong>.</li>
                  <li>Preencha os campos:
                    <ul className="list-disc list-inside pl-4 mt-1 space-y-1 text-slate-300">
                      <li><strong>Name</strong>: <code className="font-mono text-cyan-300">linkegringo</code></li>
                      <li><strong>Type</strong>: <code className="font-mono text-cyan-300">command</code></li>
                      <li><strong>Command</strong>: <code className="font-mono text-cyan-300">npx -y linkegringo-mcp</code></li>
                    </ul>
                  </li>
                </ol>
              </div>
            )}

            {/* Tab Content: Goose / Codex CLI */}
            {activeClientTab === 'codex' && (
              <div className="p-4 rounded-xl bg-[#0F172A]/70 border border-[#1E293B] space-y-3 animate-in fade-in">
                <p className="text-xs text-slate-300">
                  Execute no seu terminal para registrar o servidor diretamente:
                </p>
                <div className="flex items-center justify-between p-2.5 rounded bg-black/60 border border-[#1E293B]">
                  <code className="text-xs font-mono text-cyan-300">
                    goose configure --add-extension "npx -y linkegringo-mcp"
                  </code>
                  <button
                    type="button"
                    onClick={() =>
                      copyToClipboard('goose configure --add-extension "npx -y linkegringo-mcp"', 'goose-cmd')
                    }
                    className="text-slate-400 hover:text-white text-xs pl-2"
                  >
                    {copiedKey === 'goose-cmd' ? 'Copiado!' : 'Copiar'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Card 3: MCP Tools Exposed */}
          <div className="p-4 rounded-xl bg-[#0A0E1A] border border-[#1E293B] space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Ferramentas Nativas Disponíveis no Servidor MCP
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded bg-[#0F172A]/50 border border-[#1E293B]/60">
                <div className="font-mono font-medium text-cyan-300">audit_profile</div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  Diagnóstico completo, nota Inbound (0-100), gargalos e lacunas técnicas.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0F172A]/50 border border-[#1E293B]/60">
                <div className="font-mono font-medium text-cyan-300">simulate_recruiter_search</div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  Simula filtros booleanos do LinkedIn Recruiter com peso 3x em Headline/Skills.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0F172A]/50 border border-[#1E293B]/60">
                <div className="font-mono font-medium text-cyan-300">convert_to_xyz_bullet</div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  Transforma bullets comuns na fórmula Accomplished [X], measured by [Y], by doing [Z].
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0F172A]/50 border border-[#1E293B]/60">
                <div className="font-mono font-medium text-cyan-300">generate_headline_proposals</div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  Gera 3 variações de Headline $\le$ 160 caracteres para visualização perfeita.
                </div>
              </div>

              <div className="p-2.5 rounded bg-[#0F172A]/50 border border-[#1E293B]/60 sm:col-span-2">
                <div className="font-mono font-medium text-cyan-300">check_chrome_cdp_status</div>
                <div className="text-slate-400 mt-0.5 text-[11px]">
                  Verifica a porta de depuração do Chrome (9222) e lista abas abertas do LinkeGringo.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-[#1E293B] bg-[#0E1424]">
          <span className="text-xs text-slate-400">
            LinkeGringo é 100% Client-Side e Open Source. Suas credenciais nunca saem da sua máquina.
          </span>
          <Button variant="default" size="sm" onClick={onClose} className="h-8 px-4 text-xs font-medium">
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
}
