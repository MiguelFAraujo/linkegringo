import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  Info,
  CheckCircle2,
  Sparkles,
  Briefcase,
  MinusCircle,
} from 'lucide-react';
import type { InterviewAnswer, InterviewPlan } from '@linkegringo/core';

interface InterviewViewProps {
  plan: InterviewPlan;
  onSubmitAnswers: (answers: InterviewAnswer[]) => Promise<void>;
  isLoading: boolean;
  roundNumber?: number;
  overallScore?: number;
  isPolishMode?: boolean;
  onSkipToFacts?: () => void;
}

export function InterviewView({
  plan,
  onSubmitAnswers,
  isLoading,
  roundNumber = 1,
  overallScore,
  isPolishMode,
  onSkipToFacts,
}: InterviewViewProps) {
  const questions = plan.questions;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<string, { value: string; skipped: boolean }>>({});

  const isElitePolish = Boolean(isPolishMode || (overallScore && overallScore >= 92));

  // Reset question index and answers when round or plan changes
  useEffect(() => {
    setCurrentIndex(0);
    setAnswersMap({});
  }, [roundNumber, plan]);

  const currentQ = questions[currentIndex];
  const totalQuestions = questions.length;
  const progressPercent = totalQuestions > 0 ? Math.round(((currentIndex + 1) / totalQuestions) * 100) : 100;

  const currentAnswer = answersMap[currentQ?.id] || { value: '', skipped: false };

  const handleTextChange = (text: string) => {
    if (!currentQ) return;
    setAnswersMap({
      ...answersMap,
      [currentQ.id]: { value: text, skipped: false },
    });
  };

  const handleSkip = () => {
    if (!currentQ) return;
    setAnswersMap({
      ...answersMap,
      [currentQ.id]: { value: '', skipped: true },
    });
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNotApplicable = () => {
    if (!currentQ) return;
    setAnswersMap({
      ...answersMap,
      [currentQ.id]: { value: 'Não se aplica ao meu contexto', skipped: true },
    });
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleFinish = async () => {
    const formattedAnswers: InterviewAnswer[] = questions.map((q) => {
      const recorded = answersMap[q.id];
      return {
        questionId: q.id,
        value: recorded?.value || '',
        skipped: recorded?.skipped || false,
      };
    });

    await onSubmitAnswers(formattedAnswers);
  };

  const categoryLabels: Record<string, string> = {
    direction: 'Posicionamento Estratégico',
    responsibility: 'Trabalho Invisível & Responsabilidade',
    'technical-depth': 'Profundidade Técnica & Decisões',
    impact: 'Impacto & Resultados de Negócio',
    scale: 'Escala & Volumetria',
    leadership: 'Liderança Técnica & Mentoria',
    preference: 'Preferências de Stack',
    market: 'Alinhamento com Mercado Americano',
    credibility: 'Credibilidade & Evidências',
    differentiation: 'Diferencial Competitivo',
  };

  if (!currentQ) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-slate-400">Nenhuma pergunta encontrada para esta rodada.</p>
        {onSkipToFacts && (
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onSkipToFacts}
            className="text-xs font-semibold"
          >
            Avançar direto para validação de fatos
          </Button>
        )}
      </div>
    );
  }

  const isLastQuestion = currentIndex === totalQuestions - 1;

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* 2-Column Desktop Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar Column (lg:col-span-4): Context & Progress Panel */}
        <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F1623]/80 p-5 sm:p-6 space-y-5 shadow-sm">
            {/* Progress and Question Counter */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-1.5">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  {isElitePolish
                    ? 'Modo Lapidação'
                    : roundNumber >= 2
                    ? `Rodada ${roundNumber}`
                    : 'Entrevista'}
                </span>
                <span className="text-xs text-slate-400 font-medium font-mono">
                  {progressPercent}%
                </span>
              </div>

              <h1 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {isElitePolish
                  ? `Entrevista técnica (Modo Lapidação) — pergunta ${currentIndex + 1} de ${totalQuestions}`
                  : roundNumber >= 2
                  ? `Entrevista técnica (Rodada ${roundNumber}: Aprofundamento de Arquitetura & Escala) — pergunta ${currentIndex + 1} de ${totalQuestions}`
                  : `Entrevista técnica — pergunta ${currentIndex + 1} de ${totalQuestions}`}
              </h1>

              <Progress value={progressPercent} className="h-1.5 bg-slate-800/80 mt-2" />
            </div>

            {/* Polish Mode Indicator */}
            {isElitePolish && (
              <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-500/20 text-xs text-blue-200 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <strong className="text-white font-medium">Modo Lapidação Ativo:</strong> Seu perfil já cumpre os requisitos de excelência dos EUA. Estas perguntas visam refinar nuances de arquitetura, resiliência e escala sob estresse.
                </div>
              </div>
            )}

            {/* Architectural Deepening Round Indicator */}
            {roundNumber >= 2 && !isElitePolish && (
              <div className="p-3.5 rounded-xl bg-[#0F1623]/90 border border-[#1E293B] text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <strong className="text-white font-medium">Aprofundamento Técnico:</strong> A IA identificou pontos adicionais de métricas e arquitetura para consolidar seu perfil.
                </div>
              </div>
            )}

            {/* US Recruiter Context Note */}
            <div className="p-4 rounded-xl bg-[#090D14]/80 border border-[#1E293B] border-l-2 border-l-blue-500 space-y-2">
              <div className="text-xs font-semibold text-blue-400">
                Critério dos recrutadores dos EUA
              </div>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {currentQ.reason.replace(/^critério dos recrutadores dos eua:?\s*/i, '')}
              </p>
            </div>

            {/* Skip round 2 prompt if applicable */}
            {roundNumber >= 2 && onSkipToFacts && (
              <div className="p-3.5 rounded-xl bg-[#090D14]/60 border border-[#1E293B] space-y-2 text-xs text-slate-400">
                <p>Prefere não responder a perguntas adicionais nesta rodada?</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onSkipToFacts}
                  disabled={isLoading}
                  className="w-full text-xs border-[#1E293B] text-slate-300 hover:text-white bg-[#090D14]"
                >
                  <span>Avançar direto para validação de fatos</span>
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Column (lg:col-span-8): Answer Workspace Card */}
        <div className="lg:col-span-8 space-y-6">
          <div className="rounded-2xl border border-[#1E293B] bg-[#0F1623]/80 p-6 sm:p-8 space-y-6 shadow-sm">
            {/* Category & Experience Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-xs text-blue-400 border-blue-500/30 font-normal">
                {categoryLabels[currentQ.category] || currentQ.category}
              </Badge>

              {currentQ.relatedExperience && (
                <Badge variant="secondary" className="text-xs text-slate-300 border-[#1E293B] bg-[#090D14] gap-1 font-normal">
                  <Briefcase className="w-3 h-3 text-slate-400" />
                  {currentQ.relatedExperience}
                </Badge>
              )}
            </div>

            {/* Question in Wide Editorial Prominence (22px) */}
            <h2 className="text-xl sm:text-[22px] font-semibold text-white leading-relaxed tracking-tight">
              {currentQ.question}
            </h2>

            {/* Answer Field */}
            <div className="space-y-2.5 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300">
                  Sua resposta
                </label>
                <button
                  type="button"
                  onClick={handleNotApplicable}
                  className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                  title="Marcar que esta pergunta não se aplica ao seu histórico profissional"
                >
                  <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span>Não se aplica ao meu contexto</span>
                </button>
              </div>

              {currentAnswer.value === 'Não se aplica ao meu contexto' && (
                <div className="p-3 rounded-xl bg-[#090D14] border border-[#1E293B] text-slate-300 text-xs flex items-center gap-2 animate-in fade-in">
                  <MinusCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>Esta pergunta foi marcada como <strong>não aplicável</strong> ao seu contexto e será desconsiderada na síntese.</span>
                </div>
              )}

              {currentQ.answerType === 'single-choice' && currentQ.options ? (
                <div className="space-y-2">
                  {currentQ.options.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleTextChange(opt)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                        currentAnswer.value === opt
                          ? 'border-blue-500 bg-blue-600/15 text-white font-medium'
                          : 'border-[#1E293B] bg-[#090D14]/70 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <Textarea
                  rows={5}
                  value={currentAnswer.value}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Ex: Na migração, sustentamos ~2M req/dia e reduzimos a latência de 350ms para 80ms configurando pool de conexões e particionamento..."
                  className="text-sm leading-relaxed bg-[#090D14]/80 border-[#1E293B] focus:border-blue-500 rounded-xl p-4"
                />
              )}

              <p className="text-xs text-slate-500">
                Responda em português ou inglês. Os fatos técnicos serão sintetizados com precisão na reescrita final.
              </p>
            </div>

            {/* Well-Spaced Bottom Navigation Bar (No Arrows) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-5 border-t border-[#1E293B]">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrev}
                  disabled={currentIndex === 0 || isLoading}
                  className="text-slate-400 hover:text-white text-xs h-9 px-3"
                >
                  <span>Voltar</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSkip}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-slate-200 border-[#1E293B] bg-[#090D14]/50 hover:bg-[#090D14] text-xs h-9 px-3"
                  title="Pular pergunta sem preencher"
                >
                  <span>Pular pergunta</span>
                </Button>

                {onSkipToFacts && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={onSkipToFacts}
                    disabled={isLoading}
                    className="text-slate-400 hover:text-slate-200 text-xs h-9 px-3"
                    title="Finalizar entrevista antecipadamente e avançar direto para os fatos"
                  >
                    <span>Finalizar entrevista antecipadamente</span>
                  </Button>
                )}
              </div>

              <div>
                {isLastQuestion ? (
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    disabled={isLoading}
                    onClick={handleFinish}
                    className="w-full sm:w-auto font-medium text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 rounded-xl shadow-sm"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Extraindo fatos confirmáveis...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <span>Finalizar e revisar fatos</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="default"
                    size="default"
                    onClick={handleNext}
                    className="w-full sm:w-auto font-medium text-xs sm:text-sm bg-blue-600 hover:bg-blue-500 text-white h-9 px-5 rounded-xl shadow-sm"
                  >
                    <span>Próxima pergunta</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
