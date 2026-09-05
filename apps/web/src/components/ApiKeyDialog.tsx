import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Key,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Sparkles,
} from 'lucide-react';
import { createAiProvider, getAvailableProviders } from '@linkegringo/ai';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  providerId: string;
  onSave: (apiKey: string, providerId: string) => void;
  onClear: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  apiKey,
  providerId,
  onSave,
  onClear,
}: ApiKeyDialogProps) {
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [currentProvider, setCurrentProvider] = useState(providerId);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    setCurrentKey(apiKey);
    setCurrentProvider(providerId);
    setTestResult(null);
  }, [open, apiKey, providerId]);

  const handleTest = async () => {
    if (currentProvider === 'gemini' && !currentKey.trim()) {
      setTestResult({ ok: false, message: 'Digite ou cole uma chave de API antes de testar.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const provider = createAiProvider(currentProvider, { apiKey: currentKey.trim() });
      const ok = await provider.testConnection();
      if (ok) {
        setTestResult({
          ok: true,
          message: 'Conexão estabelecida com sucesso com o Google Gemini!',
        });
      } else {
        setTestResult({
          ok: false,
          message: 'Falha ao validar a chave. Verifique se a chave foi copiada corretamente.',
        });
      }
    } catch (err: any) {
      setTestResult({
        ok: false,
        message: `Erro na validação: ${err?.message || 'Falha de rede'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSave(currentKey.trim(), currentProvider);
    onOpenChange(false);
  };

  const handleRemove = () => {
    setCurrentKey('');
    onClear();
    setTestResult(null);
  };

  const providers = getAvailableProviders();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-white">
            <Key className="w-5 h-5 text-emerald-400" />
            Configuração de Provedor & Chave de IA
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            LinkeGringo é 100% client-side (BYOK). Sua chave não é enviada para nossos servidores — ela fica armazenada apenas no seu navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Provider Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Provedor de Inteligência Artificial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {providers.map((p) => {
                const isSelected = currentProvider === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setCurrentProvider(p.id);
                      setTestResult(null);
                    }}
                    className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/10 text-white'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-medium text-sm text-slate-100">
                      {p.id === 'demo' && <Sparkles className="w-4 h-4 text-amber-400" />}
                      {p.name}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gemini Key Input */}
          {currentProvider === 'gemini' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Google Gemini API Key
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium"
                >
                  Criar chave grátis no AI Studio <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <Input
                type="password"
                placeholder="AIzaSy..."
                value={currentKey}
                onChange={(e) => {
                  setCurrentKey(e.target.value);
                  setTestResult(null);
                }}
                className="font-mono text-xs"
              />

              <p className="text-[11px] text-slate-500">
                Dica: O Google Gemini 2.5 Flash é gratuito no AI Studio e processa arquivos PDF nativamente sem custos.
              </p>
            </div>
          )}

          {/* Test Status Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-start gap-2.5 text-xs ${
                testResult.ok
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              }`}
            >
              {testResult.ok ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        <DialogFooter className="sm:justify-between items-center gap-2">
          <div>
            {apiKey && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRemove}
                className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 text-xs"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remover Chave
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleTest}
              disabled={testing || (currentProvider === 'gemini' && !currentKey.trim())}
              className="text-xs"
            >
              {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Testar Conexão'}
            </Button>

            <Button
              type="button"
              variant="default"
              size="sm"
              onClick={handleSave}
              className="text-xs"
            >
              Salvar Configuração
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
