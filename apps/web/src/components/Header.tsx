import { Key, Sparkles, HelpCircle, Globe, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

function GithubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

interface HeaderProps {
  apiKey: string;
  providerId: string;
  model?: string;
  onOpenApiKeyDialog: () => void;
  onOpenOnboarding: () => void;
  onToggleDemoMode: () => void;
  onResetSession: () => void;
  hasActiveSession: boolean;
}

export function Header({
  apiKey,
  providerId,
  model,
  onOpenApiKeyDialog,
  onOpenOnboarding,
  onToggleDemoMode,
  onResetSession,
  hasActiveSession,
}: HeaderProps) {
  const isDemo = providerId === 'demo';
  const hasKey = Boolean(apiKey && apiKey.trim().length > 0);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-md shadow-emerald-950/40">
            <Globe className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">
                Linke<span className="text-emerald-400">Gringo</span>
              </span>
              <Badge variant="outline" className="text-[10px] uppercase font-mono tracking-wider py-0 px-1.5 border-emerald-500/30 text-emerald-400">
                BYOK • 100% Client-Side
              </Badge>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Posicionamento internacional para devs brasileiros nos EUA
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Status Badge */}
          {isDemo ? (
            <Badge variant="warning" className="cursor-pointer gap-1.5 py-1 px-3 text-xs" onClick={onOpenApiKeyDialog}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Modo Demo (Offline)</span>
            </Badge>
          ) : hasKey ? (
            <Badge
              variant="success"
              className="cursor-pointer gap-1.5 py-1 px-3 text-xs bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              onClick={onOpenApiKeyDialog}
            >
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{model ? `${model} Conectado` : 'Gemini Conectado'}</span>
            </Badge>
          ) : (
            <Badge
              variant="destructive"
              className="cursor-pointer gap-1.5 py-1 px-3 text-xs bg-amber-500/15 text-amber-300 border-amber-500/30 animate-pulse"
              onClick={onOpenApiKeyDialog}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Configurar API Key</span>
            </Badge>
          )}

          {/* New / Reset Session Button if in session */}
          {hasActiveSession && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetSession}
              className="text-slate-400 hover:text-slate-200 hidden md:flex items-center gap-1.5"
              title="Recomeçar do zero"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Novo Perfil</span>
            </Button>
          )}

          {/* Demo Toggle Button */}
          <Button
            variant={isDemo ? 'secondary' : 'outline'}
            size="sm"
            onClick={onToggleDemoMode}
            className="text-xs"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{isDemo ? 'Usar Gemini Real' : 'Modo Demo'}</span>
          </Button>

          {/* Config Key Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenApiKeyDialog}
            title="Gerenciar Chave de API"
            className="text-slate-400 hover:text-white"
          >
            <Key className="w-4 h-4" />
          </Button>

          {/* Help / Tutorial */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenOnboarding}
            title="Como funciona"
            className="text-slate-400 hover:text-white"
          >
            <HelpCircle className="w-4 h-4" />
          </Button>

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/Muriel-Gasparini/linkegringo"
            target="_blank"
            rel="noreferrer"
            className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
            title="Repositório no GitHub"
          >
            <GithubIcon className="w-4 h-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
