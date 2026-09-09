import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Check,
  RotateCcw,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import type {
  SearchGap,
  ProfileAnalysis,
  AiProvider,
  MicroIntegrationInput,
  MicroIntegrationProposal,
  AppliedMicroIntegration,
} from '@linkegringo/core';
import {
  validateMicroIntegrationProposal,
  applyMicroIntegration,
  classifyGapTerm,
} from '@linkegringo/core';
import { createAiProvider } from '@linkegringo/ai';
import { track } from '@/lib/telemetry';

export interface GapResolutionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  gap: SearchGap | null;
  analysis: ProfileAnalysis;
  targetRole?: string;
  aiProvider?: AiProvider;
  onApplyPatch: (applied: AppliedMicroIntegration) => void;
  resolvedDiff?: {
    before: string;
    after: string;
    evidenceText?: string;
    companyName?: string;
  };
}

type DrawerStep = 'validate' | 'denied' | 'evidence' | 'proposal' | 'resolved-view';

export function GapResolutionDrawer({
  open,
  onOpenChange,
  gap,
  analysis,
  targetRole,
  aiProvider,
  onApplyPatch,
  resolvedDiff,
}: GapResolutionDrawerProps) {
  const experiences = analysis.rewritten.experiences || [];

  // Determine initial step
  const [step, setStep] = useState<DrawerStep>('validate');
  const [selectedExpId, setSelectedExpId] = useState<string>('');
  const [evidenceText, setEvidenceText] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState<MicroIntegrationProposal | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset or initialize state when gap or drawer opens
  useEffect(() => {
    if (open) {
      setErrorMessage(null);
      if (resolvedDiff) {
        setStep('resolved-view');
      } else {
        setStep('validate');
        setProposal(null);
        setEvidenceText('');
        // Pre-select target experience or first experience
        if (gap?.targetExperienceId && experiences.some((e, idx) => (e.id || `exp-${idx}`) === gap.targetExperienceId)) {
          setSelectedExpId(gap.targetExperienceId);
        } else if (experiences.length > 0) {
          setSelectedExpId(experiences[0].id || 'exp-0');
        }
      }
    }
  }, [open, gap, resolvedDiff, experiences]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onOpenChange(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const gapTerm = gap?.term || '';
  const gapKind = gap?.kind || classifyGapTerm(gapTerm);
  const isRoleGap = gapKind === 'role';

  // Selected experience object
  const selectedExp = useMemo(() => {
    return experiences.find((e, idx) => (e.id || `exp-${idx}`) === selectedExpId) || experiences[0];
  }, [experiences, selectedExpId]);

  // Related skills for denied / factual path
  const relatedSkills = useMemo(() => {
    if (!analysis?.rewritten?.skills) return [];
    return analysis.rewritten.skills.slice(0, 8);
  }, [analysis]);

  // Generate proposal via AI Provider
  const handleGenerateProposal = async () => {
    if (!gap || !evidenceText.trim()) return;

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const provider = aiProvider || createAiProvider('demo');

      const targetBullets = selectedExp?.bullets || [];
      const currentBulletText = targetBullets[0] || analysis.rewritten.summary;
      const expIdx = experiences.findIndex((e) => e === selectedExp);
      const effectiveExpId = selectedExp?.id || (expIdx >= 0 ? `exp-${expIdx}` : 'exp-0');

      const input: MicroIntegrationInput = {
        targetRole: targetRole || analysis.profileDirection.primaryRole || 'Senior Software Engineer',
        gap: {
          ...gap,
          targetExperienceId: effectiveExpId,
          evidence: {
            status: 'confirmed',
            source: 'candidate',
            evidenceText: evidenceText.trim(),
            experienceId: effectiveExpId,
          },
        },
        currentText: currentBulletText,
        context: {
          headline: analysis.rewritten.headline,
          summary: analysis.rewritten.summary,
          skills: analysis.rewritten.skills,
          experience: selectedExp,
        },
        evidence: {
          status: 'confirmed',
          source: 'candidate',
          evidenceText: evidenceText.trim(),
          experienceId: effectiveExpId,
        },
        style: {
          language: 'en',
          tone: 'executive',
        },
      };

      if (!provider.generateMicroIntegration) {
        throw new Error('O provedor de IA atual não implementa generateMicroIntegration.');
      }
      const result = await provider.generateMicroIntegration(input);

      if (result.status === 'blocked') {
        setErrorMessage(
          result.rationale ||
            'Não foi possível gerar uma integração segura sem distorcer o perfil original.',
        );
        setIsGenerating(false);
        return;
      }

      // Pre-validate proposal with core domain rules
      const validation = validateMicroIntegrationProposal({
        proposal: result,
        input,
        currentAnalysis: analysis,
      });

      if (!validation.valid) {
        setErrorMessage(
          `Proposta rejeitada pelas regras de integridade: ${validation.reasons.join('; ')}`,
        );
        setIsGenerating(false);
        return;
      }

      setProposal(result);
      setStep('proposal');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Falha ao gerar integração com IA.';
      setErrorMessage(msg);
    } finally {
      setIsGenerating(false);
    }
  };

  // Apply the validated proposal
  const handleApplyProposal = () => {
    if (!proposal || !gap) return;

    try {
      const input: MicroIntegrationInput = {
        targetRole: targetRole || analysis.profileDirection.primaryRole,
        gap,
        currentText: proposal.before,
        evidence: {
          status: 'confirmed',
          source: 'candidate',
          evidenceText: (proposal.matchedEvidence && proposal.matchedEvidence[0]) || evidenceText,
          experienceId: proposal.target.experienceId,
        },
      };

      const validation = validateMicroIntegrationProposal({
        proposal,
        input,
        currentAnalysis: analysis,
      });

      if (!validation.valid) {
        setErrorMessage(
          `Não foi possível aplicar: ${validation.reasons.join(', ')}`,
        );
        return;
      }

      const applied = applyMicroIntegration(analysis, proposal);
      onApplyPatch(applied);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erro ao aplicar alteração.';
      setErrorMessage(msg);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Slide-over Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        className="relative z-10 w-full max-w-xl bg-[#0F1623] border-l border-[#1E293B] shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300"
      >
        {/* Drawer Header */}
        <div className="p-5 sm:p-6 border-b border-[#1E293B] flex items-center justify-between bg-[#090D14]/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-xs uppercase font-mono tracking-wider border-blue-500/40 bg-blue-950/30 text-blue-300"
              >
                Inbound Loop
              </Badge>
              <span className="text-xs text-slate-400 font-mono">
                {gapKind.toUpperCase()}
              </span>
            </div>
            <h2 id="drawer-title" className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span>{resolvedDiff ? 'Alteração no Perfil' : 'Integrar Termo de Busca'}</span>
              <span className="text-emerald-400 font-mono">"{gapTerm}"</span>
            </h2>
          </div>

          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            aria-label="Fechar drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl border border-rose-500/30 bg-rose-950/20 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-400" />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* VIEW: Resolved Diff (Opened via "Ver alteração") */}
          {step === 'resolved-view' && resolvedDiff && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/15 space-y-2">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Termo indexado com sucesso</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Este termo foi integrado a partir de uma evidência confirmada e agora indexa como{' '}
                  <strong className="text-emerald-300 font-mono">MATCH</strong> na busca de recrutadores.
                </p>
                {resolvedDiff.companyName && (
                  <div className="text-[11px] text-slate-400 pt-1">
                    Posicionado em: <strong className="text-white">{resolvedDiff.companyName}</strong>
                  </div>
                )}
              </div>

              {resolvedDiff.evidenceText && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400">Evidência factual confirmada:</span>
                  <div className="p-3 rounded-xl border border-[#1E293B] bg-[#090D14] text-xs text-slate-200 italic">
                    "{resolvedDiff.evidenceText}"
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400">Diff no perfil:</span>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-3 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-300 line-through">
                    {resolvedDiff.before}
                  </div>
                  <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/25 text-emerald-300">
                    {resolvedDiff.after}
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E293B]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-xs border-[#1E293B] text-slate-300 hover:bg-slate-800"
                >
                  Fechar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1: Fact Validation & Scope Check */}
          {step === 'validate' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-[#1E293B] bg-[#090D14]/70 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Validação Factual Obrigatória</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  {isRoleGap
                    ? `A posição de "${gapTerm}" é compatível com o escopo que você realmente exerceu?`
                    : `Você já utilizou "${gapTerm}" em ambiente de produção?`}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {isRoleGap
                    ? 'Para tech recruiters dos EUA, títulos como Staff e Tech Lead exigem liderança comprovada. Evitamos title inflation para que você passe sem ressalvas na triagem técnica.'
                    : 'O LinkeGringo opera com garantia de zero alucinação. Nunca inserimos tecnologias que você não tenha praticado, pois recrutadores testarão isso na primeira ligação.'}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => setStep('evidence')}
                  className="w-full py-5 text-xs sm:text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <Check className="w-4 h-4" />
                  <span>{isRoleGap ? 'Sim, exerci esse escopo' : 'Sim, usei em produção'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setStep('denied');
                    if (gap?.kind) {
                      track('micro_integration_applied', { kind: gap.kind, outcome: 'no_safe_change' });
                      track('gap_resolved', { kind: gap.kind, outcome: 'no_safe_change' });
                    }
                  }}
                  className="w-full py-5 text-xs sm:text-sm font-semibold border-[#1E293B] bg-[#090D14] text-slate-300 hover:bg-slate-800/80 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4 text-slate-400" />
                  <span>{isRoleGap ? 'Não exerci esse escopo' : 'Não usei em produção'}</span>
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1B: Denied Path (Zero Hallucination / First-Class Alternative) */}
          {step === 'denied' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/15 space-y-2">
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Postura Correta de Engenharia</span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Experiência não confirmada preserva sua credibilidade
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Para manter 100% de integridade com recrutadores internacionais, <strong className="text-white">não adicionaremos "{gapTerm}"</strong> ao seu perfil. Recrutadores dos EUA valorizam muito mais o domínio comprovado do que listas artificiais.
                </p>
              </div>

              {/* Related Competencies from Profile */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 block">
                  Competências e tecnologias reais já presentes no seu perfil:
                </span>
                <div className="flex flex-wrap gap-1.5 p-3.5 rounded-xl border border-[#1E293B] bg-[#090D14]">
                  {relatedSkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="outline"
                      className="text-xs py-1 px-2.5 bg-[#0F1623] border-[#1E293B] text-slate-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 Dica: Se a vaga exigir este termo estritamente, aborde-o na entrevista técnica explicando sua familiaridade com conceitos análogos ou velocidade de aprendizado.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                <Button
                  type="button"
                  variant="default"
                  onClick={() => onOpenChange(false)}
                  className="w-full text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
                >
                  Entendido, manter perfil factual
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('validate')}
                  className="w-full sm:w-auto text-xs border-[#1E293B] text-slate-400 hover:bg-slate-800"
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}

          {/* STEP 1A: Confirmed Path (Experience Selection + Micro-Evidence Input) */}
          {step === 'evidence' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>1. Em qual experiência você utilizou {gapTerm}?</span>
                  <span className="text-[11px] text-slate-500 font-normal">Onde ancorar a evidência</span>
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {experiences.map((exp, idx) => {
                    const expId = exp.id || `exp-${idx}`;
                    const isSelected = expId === selectedExpId;
                    return (
                      <button
                        key={expId}
                        type="button"
                        onClick={() => setSelectedExpId(expId)}
                        className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-950/30 text-white ring-1 ring-blue-500/50'
                            : 'border-[#1E293B] bg-[#090D14] text-slate-400 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-white">{exp.companyName}</span>
                          <span className="text-[11px] text-slate-400 font-normal">{exp.title}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="micro-evidence-input" className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>2. Forneça uma micro-evidência real (1 a 2 linhas):</span>
                  <span className="text-[11px] text-emerald-400 font-medium">Problema ou escala</span>
                </label>
                <Textarea
                  id="micro-evidence-input"
                  value={evidenceText}
                  onChange={(e) => setEvidenceText(e.target.value)}
                  placeholder={`Ex: Implementei pipelines de mensageria com ${gapTerm} para processar 20k eventos/segundo entre serviços de pagamento...`}
                  className="min-h-[90px] text-xs sm:text-sm bg-[#090D14] border-[#1E293B] text-white focus-visible:ring-blue-500"
                />
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  A IA formulará o bullet em inglês nativo seguindo rigorosamente o framework Google XYZ (Accomplished [X], measured by [Y], by doing [Z]).
                </p>
              </div>

              <div className="pt-3 flex items-center justify-between gap-3 border-t border-[#1E293B]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('validate')}
                  disabled={isGenerating}
                  className="text-xs border-[#1E293B] text-slate-400 hover:bg-slate-800"
                >
                  Voltar
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={handleGenerateProposal}
                  disabled={!evidenceText.trim() || isGenerating}
                  className="text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white gap-2 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Gerando com IA...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gerar integração com IA →</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* STEP 2: Proposal Diff View */}
          {step === 'proposal' && proposal && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="p-3.5 rounded-xl border border-blue-500/30 bg-blue-950/20 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Proposta Gerada no Framework XYZ</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {proposal.rationale}
                </p>
              </div>

              {/* Target Location */}
              <div className="text-xs text-slate-400 flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Alvo da alteração:{' '}
                  <strong className="text-white">
                    {selectedExp?.companyName || 'Experiência'} • {proposal.target.section}
                  </strong>
                </span>
              </div>

              {/* Diff Preview */}
              <div className="space-y-2.5">
                <span className="text-xs font-semibold text-slate-400 block">Comparativo Antes vs Depois:</span>

                <div className="space-y-2 font-mono text-xs">
                  <div className="space-y-1">
                    <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Antes</span>
                    <div className="p-3 rounded-xl border border-rose-900/40 bg-rose-950/20 text-rose-300 line-through leading-relaxed">
                      {proposal.before}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Depois</span>
                    <div className="p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/25 text-emerald-300 leading-relaxed">
                      {proposal.after}
                    </div>
                  </div>
                </div>
              </div>

              {/* Warnings if any */}
              {proposal.warnings && proposal.warnings.length > 0 && (
                <div className="p-3 rounded-xl border border-amber-500/30 bg-amber-950/15 text-[11px] text-amber-300 space-y-1">
                  <div className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Aviso
                  </div>
                  {proposal.warnings.map((w, idx) => (
                    <div key={idx}>{w}</div>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#1E293B]">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('evidence')}
                  className="text-xs border-[#1E293B] text-slate-400 hover:bg-slate-800"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Ajustar evidência
                </Button>

                <Button
                  type="button"
                  variant="default"
                  onClick={handleApplyProposal}
                  className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white gap-2 cursor-pointer shadow-lg shadow-emerald-950/50"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar alteração no Perfil ✓</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
