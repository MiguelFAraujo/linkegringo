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
  RefreshCw,
} from 'lucide-react';
import {
  AVAILABLE_GEMINI_MODELS,
  createAiProvider,
  fetchGeminiModels,
  getAvailableProviders,
  isAuthError,
} from '@linkegringo/ai';
import { getCachedGeminiModels, setCachedGeminiModels } from '../lib/storage';
import { ModelSelect, type ModelOption } from './ui/model-select';

interface ApiKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  apiKey: string;
  providerId: string;
  model?: string;
  onSave: (apiKey: string, providerId: string, model: string) => void;
  onClear: () => void;
}

export function ApiKeyDialog({
  open,
  onOpenChange,
  apiKey,
  providerId,
  model,
  onSave,
  onClear,
}: ApiKeyDialogProps) {
  const [currentKey, setCurrentKey] = useState(apiKey);
  const [currentProvider, setCurrentProvider] = useState(providerId);
  const [currentModel, setCurrentModel] = useState<string>(() => {
    if (model && model !== 'gemini-2.0-flash') return model;
    return 'gemini-2.5-flash';
  });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [models, setModels] = useState<ModelOption[]>(() => {
    if (apiKey && apiKey.trim()) {
      const cached = getCachedGeminiModels(apiKey.trim());
      if (cached && cached.models.length > 0) {
        return cached.models.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          description: m.description,
          badge: m.badge,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        }));
      }
    }
    return [];
  });

  const loadModels = React.useCallback(async (key: string, forceFresh: boolean = false) => {
    const trimmed = key.trim();
    if (!trimmed) {
      setModels([]);
      return;
    }

    if (!forceFresh) {
      const cached = getCachedGeminiModels(trimmed);
      if (cached && cached.models.length > 0) {
        const mapped: ModelOption[] = cached.models.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          description: m.description,
          badge: m.badge,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        }));
        setModels(mapped);
        setCurrentModel((prev) => {
          if (prev && prev !== 'gemini-2.0-flash' && mapped.some((m) => m.id === prev)) {
            return prev;
          }
          const fallback = mapped[0]?.id || 'gemini-2.5-flash';
          onSave(trimmed, currentProvider, fallback);
          return fallback;
        });
        return;
      }
    }

    setIsFetchingModels(true);
    setFetchError(null);

    try {
      const fetched = await fetchGeminiModels(trimmed);
      if (fetched && fetched.length > 0) {
        setCachedGeminiModels(trimmed, fetched);
        const mapped: ModelOption[] = fetched.map((m) => ({
          id: m.id,
          displayName: m.displayName,
          description: m.description,
          badge: m.badge,
          inputTokenLimit: m.inputTokenLimit,
          outputTokenLimit: m.outputTokenLimit,
        }));
        setModels(mapped);

        setCurrentModel((prev) => {
          if (prev && prev !== 'gemini-2.0-flash' && mapped.some((m) => m.id === prev)) {
            return prev;
          }
          const fallback = mapped[0]?.id || 'gemini-2.5-flash';
          onSave(trimmed, currentProvider, fallback);
          return fallback;
        });
      }
    } catch (err: any) {
      console.warn('[ApiKeyDialog] Failed to fetch remote models:', err);
      const isAuth =
        isAuthError(err) ||
        (typeof err?.message === 'string' &&
          (err.message.includes('400') ||
            err.message.includes('401') ||
            err.message.includes('403') ||
            err.message.toLowerCase().includes('not valid')));

      if (isAuth) {
        setFetchError('Chave de API do Gemini inválida ou sem permissão. Verifique sua chave.');
        setModels([]);
      } else {
        setFetchError(err?.message || 'Falha ao buscar modelos');
        setModels((prev) =>
          prev.length > 0
            ? prev
            : AVAILABLE_GEMINI_MODELS.map((m) => ({
                id: m.id,
                displayName: m.name,
                description: m.description,
                badge: m.badge,
              })),
        );
      }
    } finally {
      setIsFetchingModels(false);
    }
  }, [currentProvider, onSave]);

  // Sync state when opened
  React.useEffect(() => {
    setCurrentKey(apiKey);
    setCurrentProvider(providerId);
    const safeModel = model && model !== 'gemini-2.0-flash' ? model : 'gemini-2.5-flash';
    setCurrentModel(safeModel);
    setTestResult(null);
    setFetchError(null);

    if (open && providerId === 'gemini' && apiKey.trim()) {
      loadModels(apiKey.trim(), false);
    }
  }, [open, apiKey, providerId, model, loadModels]);

  // Debounce fetch when typing key
  React.useEffect(() => {
    if (currentProvider !== 'gemini') return;
    const trimmed = currentKey.trim();
    if (!trimmed) {
      setModels([]);
      return;
    }

    const timer = setTimeout(() => {
      if (trimmed.length >= 15) {
        loadModels(trimmed, false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentKey, currentProvider, loadModels]);

  const handleKeyBlur = () => {
    if (currentProvider !== 'gemini') return;
    const trimmed = currentKey.trim();
    if (trimmed.length >= 10 && models.length === 0 && !isFetchingModels) {
      loadModels(trimmed, false);
    }
  };

  const handleTest = async () => {
    if (currentProvider === 'gemini' && !currentKey.trim()) {
      setTestResult({ ok: false, message: 'Digite ou cole uma chave de API antes de testar.' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const provider = createAiProvider(currentProvider, {
        apiKey: currentKey.trim(),
        model: currentModel,
      });
      const ok = await provider.testConnection();
      if (ok) {
        setTestResult({
          ok: true,
          message: 'Conexão estabelecida com sucesso com o Google Gemini!',
        });
        if (currentProvider === 'gemini') {
          await loadModels(currentKey.trim(), false);
        }
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
    onSave(currentKey.trim(), currentProvider, currentModel);
    onOpenChange(false);
  };

  const handleRemove = () => {
    setCurrentKey('');
    setModels([]);
    setCurrentModel('gemini-2.5-flash');
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

          {/* Gemini Key Input & Model Selector */}
          {currentProvider === 'gemini' && (
            <div className="space-y-3">
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
                  onBlur={handleKeyBlur}
                  className="font-mono text-xs"
                />

                <p className="text-[11px] text-slate-500">
                  Dica: A chave do Google Gemini é 100% gratuita no Google AI Studio e processa currículos em PDF nativamente.
                </p>
              </div>

              {/* Gemini Model Selector */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Modelo do Google Gemini
                  </label>
                  <button
                    type="button"
                    onClick={() => loadModels(currentKey.trim(), true)}
                    disabled={isFetchingModels || !currentKey.trim()}
                    className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Recarregar modelos da Google AI"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFetchingModels ? 'animate-spin' : ''}`} />
                    <span>{isFetchingModels ? 'Buscando...' : 'Recarregar Modelos'}</span>
                  </button>
                </div>

                <ModelSelect
                  value={currentModel}
                  onChange={(m) => {
                    setCurrentModel(m);
                    setTestResult(null);
                    onSave(currentKey.trim(), currentProvider, m);
                  }}
                  models={models}
                  disabled={!currentKey.trim() || models.length === 0 || isFetchingModels}
                  disabledMessage="Insira uma chave válida para carregar os modelos"
                  isLoading={isFetchingModels}
                />

                {fetchError && (
                  <p className="text-[11px] text-amber-400/90 leading-tight">
                    Aviso: {fetchError}. Usando opções padrão em contingência.
                  </p>
                )}

                <p className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span>
                    <strong>Resiliência Ativa:</strong> Em caso de sobrecarga (503/429), o sistema retenta e chaveia automaticamente entre os modelos Flash em contingência.
                  </span>
                </p>
              </div>
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
