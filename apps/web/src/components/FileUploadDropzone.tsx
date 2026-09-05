import React, { useState, useRef } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FileText,
  FileCheck,
  X,
  AlertCircle,
  Plus,
  Info,
  Briefcase,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
} from 'lucide-react';
import { fileToBase64 } from '@/lib/file-utils';

export const QUICK_TARGET_ROLES = [
  'Senior Backend Engineer',
  'Senior Full Stack Engineer',
  'Senior Frontend Engineer',
  'Staff Engineer',
  'Mobile Engineer (iOS/Android)',
];

interface FileUploadDropzoneProps {
  onAnalyze: (files: {
    pdfBase64: string;
    cvPdfBase64?: string;
    fileName: string;
    targetRole?: string;
  }) => Promise<void>;
  onLoadDemo: (targetRole?: string) => void;
  isLoading: boolean;
  onOpenApiKeyDialog: () => void;
  hasApiKey: boolean;
  isDemoMode: boolean;
}

export function FileUploadDropzone({
  onAnalyze,
  onLoadDemo,
  isLoading,
  onOpenApiKeyDialog,
  hasApiKey,
  isDemoMode,
}: FileUploadDropzoneProps) {
  const [linkedinFile, setLinkedinFile] = useState<File | null>(null);
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [targetRole, setTargetRole] = useState('Senior Backend Engineer');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const linkedinInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

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

  const handleCvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
        setError('O currículo adicional precisa ser um arquivo PDF.');
        return;
      }
      setCvFile(file);
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
      let cvPdfBase64: string | undefined;
      if (cvFile) {
        cvPdfBase64 = await fileToBase64(cvFile);
      }

      await onAnalyze({
        pdfBase64,
        cvPdfBase64,
        fileName: linkedinFile.name,
        targetRole: targetRole.trim() || undefined,
      });
    } catch (err: any) {
      console.error('Erro ao ler arquivos:', err);
      setError(`Erro ao processar arquivo: ${err?.message || 'Arquivo inválido'}`);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Coluna Esquerda (lg:col-span-5): Hero editorial + Pilares de confiança */}
        <div className="lg:col-span-5 space-y-8">
          <div className="space-y-4 text-left">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0F1623] border border-[#1E293B] text-xs text-slate-400 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <span>Posicionamento Internacional</span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Destrave seu perfil do LinkedIn para recrutadores dos EUA
            </h1>
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
              Faça o upload do seu perfil em PDF e defina seu cargo-alvo. Receba um diagnóstico técnico detalhado, passe pela entrevista de aprofundamento e receba o perfil pronto em inglês nativo.
            </p>
          </div>

          {/* Pilares de confiança em formato de lista editorial limpa, sem caixas pesadas */}
          <div className="pt-6 border-t border-[#1E293B] space-y-6">
            <div className="flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">Processamento local</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Executa diretamente no seu navegador, sem trafegar dados privados por servidores de aplicação externos.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <KeyRound className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">Chave própria (BYOK)</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Utilize a cota gratuita do Google AI Studio com controle absoluto e privacidade auditável.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-slate-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-slate-200">Validação rigorosa</h3>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                  Fatos técnicos e métricas extraídos são revisados com você antes de compor o perfil final.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Coluna Direita (lg:col-span-7): Card de ação interativa */}
        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F1623]/80 p-6 sm:p-7 space-y-6 shadow-xl">
            {/* Seletor de Cargo-alvo nos EUA */}
            <div className="space-y-3 p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/60">
              <div className="flex items-center justify-between">
                <label htmlFor="target-role" className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                  Cargo alvo nos EUA
                </label>
                <span className="text-[11px] text-slate-500">Alinha o escrutínio e as palavras-chave</span>
              </div>

              <Input
                id="target-role"
                type="text"
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                placeholder="Ex: Senior Backend Engineer, Senior Full Stack Engineer..."
                className="text-sm bg-[#0F1623] border-[#1E293B] text-slate-200 placeholder:text-slate-500 focus-visible:border-slate-600 focus-visible:ring-1 focus-visible:ring-slate-600"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">Sugestões rápidas:</span>
                {QUICK_TARGET_ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`px-2.5 py-1 rounded-md text-xs transition-colors border cursor-pointer ${
                      targetRole === role
                        ? 'bg-[#1E293B] text-white border-slate-600 font-medium'
                        : 'bg-[#0F1623]/60 text-slate-400 hover:text-slate-200 border-[#1E293B] hover:border-slate-700'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropzone tátil de PDF do LinkedIn */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !linkedinFile && linkedinInputRef.current?.click()}
              className={`relative rounded-xl p-8 border border-dashed transition-colors flex flex-col items-center justify-center text-center cursor-pointer ${
                isDragging
                  ? 'border-slate-400 bg-[#151E2E]'
                  : linkedinFile
                  ? 'border-slate-700 bg-[#090D14]/80 cursor-default'
                  : 'border-[#1E293B] bg-[#090D14]/40 hover:border-slate-600 hover:bg-[#090D14]/70'
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
                  <div className="flex items-center gap-3 text-left overflow-hidden">
                    <div className="h-10 w-10 rounded-lg bg-[#151E2E] text-slate-300 flex items-center justify-center flex-shrink-0 border border-[#1E293B]">
                      <FileCheck className="h-5 w-5 text-slate-300" />
                    </div>
                    <div className="truncate">
                      <p className="font-medium text-white truncate text-sm">{linkedinFile.name}</p>
                      <p className="text-xs text-slate-400">
                        PDF do LinkedIn ({formatFileSize(linkedinFile.size)})
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
                    }}
                    className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 h-8 w-8 cursor-pointer"
                    title="Remover arquivo"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-2.5 py-2">
                  <div className="h-11 w-11 mx-auto rounded-xl bg-[#151E2E] text-slate-400 flex items-center justify-center border border-[#1E293B]">
                    <FileText className="h-5 w-5 text-slate-300 stroke-[1.5]" />
                  </div>
                  <div>
                    <p className="font-medium text-sm text-slate-200">
                      Arraste o PDF do seu LinkedIn aqui
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      ou selecione o arquivo no computador
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 bg-[#090D14]/80 px-3 py-1 rounded-md border border-[#1E293B]">
                    <Info className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                    <span>No LinkedIn: Perfil &gt; Mais &gt; Salvar como PDF</span>
                  </div>
                </div>
              )}
            </div>

            {/* Currículo adicional em PDF */}
            <div className="pt-2 border-t border-[#1E293B]">
              <input
                ref={cvInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleCvFileChange}
              />

              {cvFile ? (
                <div className="flex items-center justify-between p-3 rounded-xl border border-[#1E293B] bg-[#090D14]/50">
                  <div className="flex items-center gap-2.5 truncate">
                    <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="text-xs text-slate-200 truncate">{cvFile.name}</span>
                    <span className="text-[11px] text-slate-500">({formatFileSize(cvFile.size)})</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setCvFile(null)}
                    className="text-xs text-slate-400 hover:text-rose-400 h-7 px-2 cursor-pointer"
                  >
                    Remover
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => cvInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-[#1E293B] hover:border-slate-700 bg-[#090D14]/30 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar currículo em PDF (opcional para enriquecer métricas)</span>
                </button>
              )}
            </div>

            {/* Mensagem de erro */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Botões de Ação */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onLoadDemo(targetRole || undefined)}
                className="w-full sm:w-auto text-xs text-slate-400 hover:text-slate-200 hover:bg-[#151E2E] border border-[#1E293B] font-normal cursor-pointer"
              >
                Testar com perfil de demonstração
              </Button>

              <Button
                type="button"
                variant="default"
                size="lg"
                disabled={!linkedinFile || isLoading}
                onClick={handleSubmit}
                className="w-full sm:w-auto font-medium text-sm bg-white text-slate-950 hover:bg-slate-200 disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="h-4 w-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    <span>Analisando perfil...</span>
                  </div>
                ) : (
                  <span>Analisar Perfil</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

