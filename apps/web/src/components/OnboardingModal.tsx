import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { KeyRound, FileDown, Rocket, ExternalLink, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStartDemo: () => void;
  onOpenApiKey: () => void;
}

export function OnboardingModal({ open, onOpenChange, onStartDemo, onOpenApiKey }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-2xl">
        <DialogHeader>
          <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" /> 100% Client-Side • Privacidade Auditável
          </div>
          <DialogTitle className="text-2xl font-black text-white">
            Como destravar seu perfil para o mercado dos EUA 🇺🇸
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Siga os 3 passos simples abaixo. Todo o processamento acontece diretamente no seu navegador, sem nenhum servidor intermediário.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 my-2">
          {/* Step 1 */}
          <div className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              1
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                Obtenha sua chave gratuita do Google Gemini
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                Acesse o Google AI Studio com sua conta Google e gere uma API Key em 2 cliques. Não requer cartão de crédito.
              </p>
              <div className="mt-2 flex gap-3">
                <a
                  href="https://aistudio.google.com/"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline"
                >
                  Abrir Google AI Studio <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => {
                    onOpenChange(false);
                    onOpenApiKey();
                  }}
                  className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                >
                  Inserir chave agora
                </button>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-teal-500/10 text-teal-400 flex items-center justify-center font-bold">
              2
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <FileDown className="w-4 h-4 text-teal-400" />
                Exporte o PDF do seu perfil no LinkedIn
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                No LinkedIn, acesse seu perfil, clique no botão <strong className="text-slate-200">Mais</strong> (ou <em className="text-slate-200">More</em>) ao lado de 'Adicionar seção' e escolha <strong className="text-slate-200">Salvar como PDF</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex gap-4 p-4 rounded-xl border border-slate-800 bg-slate-900/50 hover:border-slate-700 transition-colors">
            <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
              3
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-white flex items-center gap-2">
                <Rocket className="w-4 h-4 text-emerald-400" />
                Arraste o arquivo e descubra seu Raio-X
              </h4>
              <p className="text-sm text-slate-400 mt-1">
                A IA analisa seu perfil, calcula sua nota atual (ex: 42/100), faz uma entrevista estratégica com dicas de coaching e entrega seu perfil reescrito (94/100) pronto para copiar em 1 clique!
              </p>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Garantia de Privacidade:</strong> Sua chave de API fica salva exclusivamente no seu navegador (localStorage). Nenhuma requisição passa por servidores de terceiros além da Google Cloud.
          </span>
        </div>

        <DialogFooter className="sm:justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onOpenChange(false);
              onStartDemo();
            }}
            className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
          >
            Experimentar com Perfil de Demonstração
          </Button>

          <Button
            variant="default"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto"
          >
            Entendido, vamos lá!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
