import React, { useState, useRef } from 'react';
import { Card, CardContent } from './ui/card';
import { Button } from './ui/button';
import {
  UploadCloud,
  FileText,
  FileCheck,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
} from 'lucide-react';
import { fileToBase64 } from '@/lib/file-utils';

interface FileUploadDropzoneProps {
  onAnalyze: (files: {
    pdfBase64: string;
    cvPdfBase64?: string;
    fileName: string;
  }) => Promise<void>;
  onLoadDemo: () => void;
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
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Hero Intro */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
          <Sparkles className="w-3.5 h-3.5" />
          IA Especializada em Vagas Internacionais para Brasileiros
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Destrave seu Perfil do LinkedIn para{' '}
          <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
            Recrutadores dos EUA
          </span>
        </h1>
        <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto">
          Faça o upload do seu perfil em PDF. Descubra sua nota atual (Raio-X), passe por uma entrevista adaptativa com dicas de coaching e receba o perfil pronto em inglês nativo.
        </p>
      </div>

      {/* Main Dropzone Card */}
      <Card className="border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all shadow-2xl">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Primary Upload: LinkedIn PDF */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !linkedinFile && linkedinInputRef.current?.click()}
            className={`relative rounded-2xl p-8 border-2 transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
              isDragging
                ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                : linkedinFile
                ? 'border-emerald-500/50 bg-emerald-950/20 cursor-default'
                : 'border-slate-700/80 bg-slate-900/80 hover:border-emerald-500/50 hover:bg-slate-850'
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
                  <div className="h-12 w-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <FileCheck className="h-6 w-6" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-white truncate text-base">{linkedinFile.name}</p>
                    <p className="text-xs text-slate-400">
                      PDF do LinkedIn • {formatFileSize(linkedinFile.size)}
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
                  className="text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                  title="Remover arquivo"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="h-16 w-16 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shadow-inner">
                  <UploadCloud className="h-8 w-8" />
                </div>
                <div>
                  <p className="font-bold text-lg text-white">
                    Arraste o PDF do seu LinkedIn aqui
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    ou clique para procurar no seu computador
                  </p>
                </div>
                <div className="inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-950/60 px-3 py-1 rounded-full border border-slate-800">
                  <span>💡 No LinkedIn: Perfil ➔ Mais ➔ Salvar como PDF</span>
                </div>
              </div>
            )}
          </div>

          {/* Secondary Optional Upload: Resume / CV */}
          <div className="pt-2 border-t border-slate-800/80">
            <input
              ref={cvInputRef}
              type="file"
              accept=".pdf,application/pdf"
              className="hidden"
              onChange={handleCvFileChange}
            />

            {cvFile ? (
              <div className="flex items-center justify-between p-3 rounded-xl border border-slate-800 bg-slate-950/40">
                <div className="flex items-center gap-2.5 truncate">
                  <FileText className="w-4 h-4 text-teal-400 flex-shrink-0" />
                  <span className="text-xs text-slate-200 truncate">{cvFile.name}</span>
                  <span className="text-[11px] text-slate-500">({formatFileSize(cvFile.size)})</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCvFile(null)}
                  className="text-xs text-slate-400 hover:text-rose-400 h-7 px-2"
                >
                  Remover
                </Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => cvInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-800 hover:border-slate-700 bg-slate-950/30 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Adicionar Currículo em PDF adicional (Opcional para enriquecer métricas)</span>
              </button>
            )}
          </div>

          {/* Error message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2 text-xs">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onLoadDemo}
              className="w-full sm:w-auto text-amber-400 hover:text-amber-300 border-amber-500/30 hover:bg-amber-500/10 text-xs"
            >
              <Sparkles className="w-4 h-4" />
              Testar com Perfil de Demonstração (Lucas Silveira)
            </Button>

            <Button
              type="button"
              variant="default"
              size="lg"
              disabled={!linkedinFile || isLoading}
              onClick={handleSubmit}
              className="w-full sm:w-auto font-bold text-sm shadow-lg shadow-emerald-950/50"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Extraindo Perfil & Gerando Raio-X...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>Iniciar Análise (Raio-X)</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trust & Privacy Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-center text-xs text-slate-400">
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <p className="font-semibold text-slate-200">100% Client-Side</p>
          <p className="mt-0.5">Executa diretamente no seu browser, zero servidores nossos.</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <p className="font-semibold text-slate-200">Bring Your Own Key</p>
          <p className="mt-0.5">Utilize a cota gratuita do Google AI Studio com privacidade auditável.</p>
        </div>
        <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800/80">
          <p className="font-semibold text-slate-200">Sem Alucinações</p>
          <p className="mt-0.5">Você valida os fatos técnicos antes de gerar o novo perfil.</p>
        </div>
      </div>
    </div>
  );
}
