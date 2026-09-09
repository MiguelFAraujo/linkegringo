import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FileText,
  FileCheck,
  X,
  AlertCircle,
  Info,
  Briefcase,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { fileToBase64 } from '../lib/file-utils';

export const QUICK_TARGET_ROLES = [
  'Senior Backend Engineer',
  'Senior Full Stack Engineer',
  'Senior Frontend Engineer',
  'Staff Engineer',
  'Mobile Engineer (iOS/Android)',
];

export interface FileUploadData {
  file: File;
  fileName: string;
  pdfBase64: string;
  targetRole?: string;
}

export interface FileUploadDropzoneProps {
  onAnalyze: (data: FileUploadData | any) => Promise<void>;
  onLoadDemo: (targetRole?: string) => void;
  isLoading: boolean;
  loadingMessage?: string;
  onOpenApiKeyDialog: () => void;
  hasApiKey: boolean;
  isDemoMode: boolean;
}

export function FileUploadDropzone({
  onAnalyze,
  onLoadDemo,
  isLoading,
  loadingMessage,
  onOpenApiKeyDialog,
  hasApiKey,
  isDemoMode,
}: FileUploadDropzoneProps) {
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Senior Backend Engineer');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedinInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);

    const files = Array.from(e.dataTransfer.files);
    const pdf = files.find((f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));

    if (!pdf) {
      setError('Por favor, selecione um arquivo em formato PDF (exportado do LinkedIn).');
      return;
    }

    setLinkedinFile(pdf);
  };

  const handleLinkedinFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('O arquivo precisa estar no formato PDF.');
        return;
      }
      setLinkedinFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!linkedinFile) {
      setError('Faça o upload do PDF do seu LinkedIn para começar.');
      return;
    }

    if (!hasApiKey && !isDemoMode) {
      onOpenApiKeyDialog();
      return;
    }

    setError(null);
    try {
      const pdfBase64 = await fileToBase64(linkedinFile);
      await onAnalyze({
        file: linkedinFile,
        fileName: linkedinFile.name,
        pdfBase64,
        targetRole: targetRole.trim() || undefined,
      });
    } catch (err: any) {
      console.error('Erro ao processar arquivo:', err);
      setError(`Erro ao processar arquivo: ${err?.message || 'Arquivo inválido'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-[1500px] mx-auto w-full animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Coluna Esquerda (lg:col-span-5): Posicionamento + Exemplo Visual + Linha de Confiança */}
        <div className="lg:col-span-5 space-y-6">
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-[#0F1623] border border-white/[0.08] text-xs text-blue-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Recruiter Visibility Optimizer</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-bold tracking-tight text-white leading-[1.15]">
              Pare de aplicar. Comece a ser encontrado.
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Descubra como recrutadores internacionais encontram seu perfil, onde você perde relevância e o que precisa mudar para gerar mais conversas.
            </p>
          </div>

          {/* Card de Exemplo Visual de Diagnóstico (Semanticamente isolado como EXEMPLO) */}
          <div className="p-5 rounded-2xl bg-[#0F1623]/70 border border-white/[0.08] space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wider bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                Exemplo
              </span>
              <span className="text-[11px] text-slate-500 font-medium">Relatório visual prévio</span>
            </div>

            <div className="flex items-baseline justify-between pt-1">
              <div>
                <span className="text-xs text-slate-400 block font-medium">Recruiter Visibility</span>
                <span className="text-2xl font-bold text-white tracking-tight">
                  74 <span className="text-xs font-normal text-slate-500">/ 100</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-amber-400/90 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                Bom ponto de partida · 1 gargalo crítico
              </span>
            </div>

            {/* Funil Compacto */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06] text-xs">
              <div className="space-y-1">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-medium">Busca</span>
                  <span className="font-mono text-emerald-400 font-semibold">82</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Seu perfil cobre cargo, stack e contexto relevantes para buscas de recrutadores?
                </p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-medium">Card de Triagem</span>
                  <span className="font-mono text-amber-400 font-semibold">68</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Entendem sua senioridade no card do LinkedIn Recruiter em 5 segundos?
                </p>
              </div>

              <div className="space-y-1 pt-1.5 border-t border-white/[0.04]">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-300 font-medium">Perfil Completo</span>
                  <span className="font-mono text-blue-400 font-semibold">70</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Suas evidências técnicas sustentam o escopo da posição pretendida?
                </p>
              </div>
            </div>

            {/* Biggest Unlock (Estilo Operacional de Gap) */}
            <div className="p-3 rounded-xl bg-[#090D14]/80 border border-amber-500/20 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-amber-400/90 font-semibold">
                  Biggest Unlock
                </span>
                <span className="text-[10px] text-amber-300 font-medium">→ Prioridade alta</span>
              </div>
              <span className="text-xs font-semibold text-slate-200 block">Headline positioning</span>
              <p className="text-[11px] text-slate-400 leading-normal">
                Seu título atual é genérico demais para buscas de Senior Backend Engineer.
              </p>
            </div>

            {/* Ação rápida da demo */}
            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => onLoadDemo(targetRole || undefined)}
                className="text-xs text-slate-400 hover:text-blue-300 underline font-medium cursor-pointer transition-colors"
              >
                Sem o PDF agora? Testar com perfil de demonstração →
              </button>
            </div>
          </div>

          {/* Linha de Confiança Técnica (Trust Bar) */}
          <div className="p-3.5 rounded-xl bg-[#090D14]/60 border border-white/[0.06] text-xs space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>100% Client-Side · Chave Própria (BYOK) · Sem armazenamento em servidor</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-normal">
              Seu perfil é enviado diretamente do seu navegador para a API de IA escolhida. O LinkeGringo não intercepta nem armazena seus dados.
            </p>
          </div>
        </div>

        {/* Coluna Direita (lg:col-span-7): Card de ação interativa */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-white/[0.08] bg-[#0F1623]/80 p-6 sm:p-8 space-y-6 shadow-2xl backdrop-blur-sm">
            {/* Seletor de Cargo-alvo como Busca de Recrutador */}
            <div className="space-y-3 p-4 rounded-xl border border-white/[0.08] bg-[#090D14]/60">
              <div className="flex items-center justify-between">
                <label htmlFor="target-role" className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                  What should recruiters find you for?
                </label>
                <span className="text-[11px] text-slate-500">Busca no LinkedIn Recruiter</span>
              </div>

              <Input
                id="target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Ex: Senior Backend Engineer, Senior Full Stack Engineer..."
                className="text-sm bg-[#0F1623] border-white/[0.08] text-slate-200 placeholder:text-slate-500 focus-visible:border-blue-500/50 focus-visible:ring-1 focus-visible:ring-blue-500/20"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">Sugestões de cargo-alvo:</span>
                {QUICK_TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      targetRole === role
                        ? 'bg-blue-600/20 text-blue-300 border-blue-500/50 font-medium shadow-sm'
                        : 'bg-[#0F1623]/60 text-slate-400 hover:text-slate-200 border-white/[0.08] hover:border-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Seção do Perfil Atual com Dropzone */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Seu perfil atual no LinkedIn
                </span>
                <span className="text-[11px] text-slate-500">Arquivo PDF exportado</span>
              </div>

              {/* Dropzone tátil de PDF do LinkedIn */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !linkedinFile && linkedinInputRef.current?.click()}
                className={`relative rounded-2xl min-h-[200px] border-2 border-dashed transition-all duration-200 flex flex-col items-center justify-center text-center cursor-pointer p-6 ${
                  isDragging
                    ? 'border-blue-400 bg-[#151E2E]'
                    : linkedinFile
                    ? 'border-white/[0.12] bg-[#090D14]/80 cursor-default'
                    : 'border-white/[0.12] bg-[#090D14]/60 hover:border-blue-500/50 hover:bg-[#090D14]/90'
                }`}
              >
                <input
                  ref={linkedinInputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={handleLinkedinFileChange}
                />

                {linkedinFile ? (
                  <div className="w-full flex items-center justify-between gap-4 p-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                        <FileCheck className="h-5 w-5" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-medium text-slate-200 truncate">
                          {linkedinFile.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(linkedinFile.size)}
                        </p>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLinkedinFile(null);
                        if (linkedinInputRef.current) {
                          linkedinInputRef.current.value = '';
                        }
                      }}
                      className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 cursor-pointer"
                      title="Remover arquivo"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3 py-2">
                    <div className="h-14 w-14 mx-auto rounded-2xl bg-[#151E2E] text-slate-400 flex items-center justify-center border border-white/[0.08] shadow-inner">
                      <FileText className="h-6 w-6 text-slate-300 stroke-[1.5]" />
                    </div>
                    <div>
                      <p className="font-semibold text-base text-slate-200">
                        Arraste o PDF do seu LinkedIn aqui
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        ou clique para selecionar o arquivo no computador
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-[#090D14]/80 px-3 py-1 rounded-md border border-white/[0.08]">
                      <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                      <span>No LinkedIn: Perfil &gt; Mais &gt; Salvar como PDF</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Mini-tutorial: Como exportar o PDF oficial do LinkedIn */}
              <div className="rounded-xl border border-white/[0.08] bg-[#090D14]/70 p-3.5 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                    <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
                    Como exportar o PDF correto do LinkedIn?
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">3 passos rápidos</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-0.5 text-slate-400 text-[11px] leading-relaxed">
                  <div className="p-2 rounded-lg bg-[#0F1623]/80 border border-white/[0.04] space-y-0.5">
                    <span className="font-mono font-bold text-blue-400 block text-[10px]">1. Perfil</span>
                    <p>Acesse seu perfil no LinkedIn pelo navegador no desktop.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0F1623]/80 border border-white/[0.04] space-y-0.5">
                    <span className="font-mono font-bold text-blue-400 block text-[10px]">2. Botão &quot;Mais&quot;</span>
                    <p>No cabeçalho do perfil, clique no botão <strong>Mais</strong> (ou <em>More</em>).</p>
                  </div>
                  <div className="p-2 rounded-lg bg-[#0F1623]/80 border border-white/[0.04] space-y-0.5">
                    <span className="font-mono font-bold text-emerald-400 block text-[10px]">3. Salvar como PDF</span>
                    <p>Selecione <strong>Salvar como PDF</strong> e arraste o arquivo aqui.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Microfrase de Conversão */}
            <p className="text-xs text-slate-400 text-center px-2">
              Você verá seu Recruiter Card, relevância de busca, principais gargalos e correções priorizadas.
            </p>

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLoadDemo(targetRole || undefined)}
                className="w-full sm:w-auto text-xs text-slate-300 hover:text-white hover:bg-[#151E2E] border border-white/[0.08] font-normal h-11 px-4 rounded-xl cursor-pointer"
              >
                Testar com perfil de demonstração
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={!linkedinFile || isLoading}
                onClick={handleSubmit}
                className="w-full sm:w-auto font-semibold text-sm bg-blue-600 hover:bg-blue-500 text-white disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed h-11 px-6 rounded-xl shadow-lg shadow-blue-500/10 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    <span>{loadingMessage || 'Analisando visibilidade...'}</span>
                  </div>
                ) : (
                  <span>Descobrir minha visibilidade →</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Faixa da Lógica do Produto (How LinkeGringo Works) */}
      <div className="mt-12 sm:mt-16 pt-8 border-t border-white/[0.08]">
        <div className="text-center mb-6">
          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-500">
            Como funciona a triagem do recrutador internacional
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-[#0F1623]/60 border border-white/[0.06] space-y-1.5 text-left">
            <span className="font-mono text-xs font-bold text-blue-400 block">01 BUSCA</span>
            <h4 className="text-sm font-semibold text-slate-200">Seu perfil é encontrável?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Cobre cargo, stack e contexto que recrutadores usam nas buscas.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1623]/60 border border-white/[0.06] space-y-1.5 text-left">
            <span className="font-mono text-xs font-bold text-amber-400 block">02 RECRUITER CARD</span>
            <h4 className="text-sm font-semibold text-slate-200">Entendem seu posicionamento em segundos?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Headline ancorada no cargo, anos de experiência e stack central visíveis antes do clique.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1623]/60 border border-white/[0.06] space-y-1.5 text-left">
            <span className="font-mono text-xs font-bold text-emerald-400 block">03 PERFIL</span>
            <h4 className="text-sm font-semibold text-slate-200">As evidências sustentam seu escopo?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Bullets com arquitetura, mecanismos de produção e métricas eliminam dúvidas de senioridade.
            </p>
          </div>
          <div className="p-4 rounded-xl bg-[#0F1623]/60 border border-white/[0.06] space-y-1.5 text-left">
            <span className="font-mono text-xs font-bold text-purple-400 block">04 OUTREACH</span>
            <h4 className="text-sm font-semibold text-slate-200">Seu perfil dá motivo para contato?</h4>
            <p className="text-xs text-slate-400 leading-relaxed">
              Posicionamento internacional claro para justificar o envio de um convite qualificado.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
