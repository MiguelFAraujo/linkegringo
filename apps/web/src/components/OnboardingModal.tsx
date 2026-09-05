import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { KeyRound, FileDown, CheckCircle2, FileSearch } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDemo: () => void;
  onOpenApiKey: () => void;
}

export function OnboardingModal({ open, onOpenChange, onStartDemo, onOpenApiKey }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl bg-[#0F1623] border-[#1E293B]">
        <DialogHeader>
          <div className="text-xs font-medium text-slate-400 mb-1">
            Processamento local no navegador
          </div>
          <DialogTitle className="text-2xl font-bold tracking-tight text-white">
            Como posicionar seu perfil para o mercado dos Estados Unidos
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-sm">
            Três etapas para alinhar seu LinkedIn aos padrões de contratação internacional. Todo o processamento ocorre no seu próprio navegador.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3.5 my-2">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#151E2E]/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#090D14] text-slate-300 flex items-center justify-center font-mono text-xs font-semibold border border-[#1E293B]">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-slate-400" />
                Obtenha sua chave gratuita do Google Gemini
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Acesse o Google AI Studio com sua conta Google e gere uma API Key em poucos cliques. Não requer cartão de crédito.
              </p>
              <div className="mt-2.5 flex items-center gap-3">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-slate-300 hover:text-white underline"
                >
                  Abrir Google AI Studio
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenApiKey();
                  }}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
                >
                  Inserir chave agora
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#151E2E]/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#090D14] text-slate-300 flex items-center justify-center font-mono text-xs font-semibold border border-[#1E293B]">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm flex items-center gap-2">
                <FileDown className="w-4 h-4 text-slate-400" />
                Exporte o PDF do seu perfil no LinkedIn
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                No LinkedIn, acesse seu perfil, clique no botão Mais (More) e selecione Salvar como PDF.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl border border-[#1E293B] bg-[#151E2E]/50">
            <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#090D14] text-slate-300 flex items-center justify-center font-mono text-xs font-semibold border border-[#1E293B]">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-white text-sm flex items-center gap-2">
                <FileSearch className="w-4 h-4 text-slate-400" />
                Envie o arquivo e receba o diagnóstico completo
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                A IA analisa suas experiências com base no cargo-alvo, conduz uma entrevista objetiva para extrair métricas de impacto e entrega seu perfil reescrito em inglês nativo.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-[#090D14]/80 rounded-xl p-3 border border-[#1E293B] flex items-start gap-2.5 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong className="text-slate-300 font-medium">Garantia de privacidade:</strong> Sua chave de API fica salva exclusivamente no seu navegador (localStorage). Nenhuma requisição passa por servidores de terceiros além da Google Cloud.
          </span>
        </div>

        <DialogFooter className="sm:justify-between items-center pt-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onStartDemo();
            }}
            className="text-xs text-slate-400 hover:text-slate-200 hover:bg-[#151E2E] font-normal"
          >
            Testar com perfil de demonstração
          </Button>

          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto text-xs bg-white text-slate-950 hover:bg-slate-200 font-medium"
          >
            Continuar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
