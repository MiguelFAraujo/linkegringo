import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Textarea } from './ui/textarea';
import { Progress } from './ui/progress';
import {
  Info,
  ArrowRight,
  ArrowLeft,
  SkipForward,
  CheckCircle2,
  Sparkles,
  Briefcase,
  FastForward,
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
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Progress */}
      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs text-slate-400">
          <span className="font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            {isElitePolish
              ? 'Modo Lapidação (Elite Polish Mode)'
              : roundNumber >= 2
              ? `Rodada ${roundNumber}: Aprofundamento de Arquitetura & Escala`
              : `Entrevista de Aprofundamento • Rodada ${roundNumber}`}
          </span>
          <span className="font-mono">
            Pergunta {currentIndex + 1} de {totalQuestions}
          </span>
        </div>

        {/* Polish Mode Banner */}
        {isElitePolish && (
          <div className="p-3.5 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-white">Modo Lapidação Ativo:</strong> Seu perfil já cumpre os requisitos de excelência dos EUA. Estas perguntas visam refinar nuances de arquitetura, resiliência e escala sob estresse.
            </div>
          </div>
        )}

        {roundNumber >= 2 && !isElitePolish && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 leading-relaxed flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong>Aprofundamento Técnico:</strong> A IA identificou pontos adicionais de métricas e arquitetura para consolidar seu perfil.
            </div>
          </div>
        )}

        <Progress value={progressPercent} />
      </div>

      {/* Main Question Card */}
      <Card className="border border-slate-800 bg-slate-900/80 shadow-2xl">
        <CardHeader className="space-y-3 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="text-[11px] text-blue-400 border-blue-500/30">
              {categoryLabels[currentQ.category] || currentQ.category}
            </Badge>

            {currentQ.relatedExperience && (
              <Badge variant="secondary" className="text-[11px] text-slate-300 gap-1">
                <Briefcase className="w-3 h-3 text-slate-400" />
                {currentQ.relatedExperience}
              </Badge>
            )}
          </div>

          <CardTitle className="text-xl sm:text-2xl font-bold text-white leading-snug">
            {currentQ.question}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Criterion Box */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-xs uppercase tracking-wider text-blue-400">
              <Info className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
              Critério dos recrutadores dos EUA
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-5">
              {currentQ.reason}
            </p>
          </div>

          {/* Answer Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sua Resposta
              </label>
              <button
                type="button"
                onClick={handleNotApplicable}
                className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
                title="Marcar que esta pergunta não se aplica ao seu histórico profissional"
              >
                <MinusCircle className="w-3.5 h-3.5 text-slate-400" />
                <span>Não se aplica ao meu contexto</span>
              </button>
            </div>

            {currentAnswer.value === 'Não se aplica ao meu contexto' && (
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-slate-300 text-xs flex items-center gap-2 animate-in fade-in">
                <MinusCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Esta pergunta foi marcada como <strong>não aplicável</strong> ao seu contexto e será ignorada na extração.</span>
              </div>
            )}

            {currentQ.answerType === 'single-choice' && currentQ.options ? (
              <div className="space-y-2">
                {currentQ.options.map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleTextChange(opt)}
                    className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition-all cursor-pointer ${
                      currentAnswer.value === opt
                        ? 'border-blue-500 bg-blue-500/15 text-white font-medium'
                        : 'border-slate-800 bg-slate-950/60 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            ) : (
              <Textarea
                rows={4}
                value={currentAnswer.value}
                onChange={(e) => handleTextChange(e.target.value)}
                placeholder="Ex: Na migração, sustentamos ~2M req/dia e reduzimos a latência de 350ms para 80ms configurando pool de conexões e particionamento..."
                className="text-sm leading-relaxed bg-slate-950/80 border-slate-700/80"
              />
            )}

            <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <span>Responda em português ou inglês. Os fatos técnicos serão sintetizados com precisão na reescrita final.</span>
            </p>
          </div>

          {/* Navigation & Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handlePrev}
                disabled={currentIndex === 0 || isLoading}
                className="text-slate-400 text-xs gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Anterior
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSkip}
                disabled={isLoading}
                className="text-slate-400 hover:text-slate-200 text-xs gap-1"
                title="Pular pergunta sem preencher"
              >
                <SkipForward className="w-3.5 h-3.5" /> Pular pergunta
              </Button>

              {onSkipToFacts && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onSkipToFacts}
                  disabled={isLoading}
                  className="text-slate-400 hover:text-slate-200 text-xs gap-1"
                  title="Finalizar entrevista antecipadamente e avançar direto para os fatos"
                >
                  <FastForward className="w-3.5 h-3.5" /> Finalizar entrevista antecipadamente
                </Button>
              )}
            </div>

            <div className="w-full sm:w-auto">
              {isLastQuestion ? (
                <Button
                  type="button"
                  variant="default"
                  size="lg"
                  disabled={isLoading}
                  onClick={handleFinish}
                  className="w-full sm:w-auto font-bold gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-950/50"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Extraindo fatos confirmáveis...</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span>Revisar dados confirmados</span>
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
                  className="w-full sm:w-auto font-semibold gap-2 text-sm bg-blue-600 hover:bg-blue-500 text-white"
                >
                  <span>Próxima</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skip round 2 prompt if applicable */}
      {roundNumber >= 2 && onSkipToFacts && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 text-xs text-slate-400">
          <span>Prefere não responder a perguntas adicionais nesta rodada?</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onSkipToFacts}
            disabled={isLoading}
            className="text-xs gap-1.5 border-slate-700 text-slate-300 hover:text-white"
          >
            <FastForward className="w-3.5 h-3.5 text-blue-400" />
            <span>Avançar direto para validação de fatos</span>
          </Button>
        </div>
      )}
    </div>
  );
}
