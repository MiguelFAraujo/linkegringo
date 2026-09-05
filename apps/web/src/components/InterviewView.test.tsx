import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { InterviewView } from './InterviewView';
import type { InterviewPlan } from '@linkegringo/core';

describe('InterviewView Component', () => {
  const samplePlan: InterviewPlan = {
    questions: [
      {
        id: 'q1',
        category: 'scale',
        question: 'Qual o volume de transações com Kafka?',
        reason: 'Recrutadores querem saber da escala.',
        answerType: 'long-text',
        required: false,
      },
      {
        id: 'q2',
        category: 'technical-depth',
        question: 'Qual o maior trade-off de arquitetura na migração?',
        reason: 'Decisões técnicas mostram senioridade.',
        answerType: 'long-text',
        required: false,
      },
    ],
  };

  it('renders round 1 header and questions correctly', () => {
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={1}
      />,
    );

    expect(screen.getByText(/Entrevista técnica — pergunta 1 de 2/i)).toBeDefined();
    expect(screen.getByText(/Qual o volume de transações com Kafka\?/i)).toBeDefined();
    expect(screen.getByText(/Critério dos recrutadores dos EUA/i)).toBeDefined();
  });

  it('renders round 2 with deeper architectural deepening label and banner', () => {
    const handleSkipToFacts = vi.fn();
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={2}
        onSkipToFacts={handleSkipToFacts}
      />,
    );

    expect(screen.getByText(/Rodada 2: Aprofundamento de Arquitetura & Escala/i)).toBeDefined();
    expect(screen.getByText(/Aprofundamento Técnico:/i)).toBeDefined();

    // Secondary banner to skip directly to facts in round 2
    expect(screen.getByText(/Prefere não responder a perguntas adicionais nesta rodada\?/i)).toBeDefined();
    const skipBtn = screen.getByText(/Avançar direto para validação de fatos/i);
    fireEvent.click(skipBtn);
    expect(handleSkipToFacts).toHaveBeenCalledTimes(1);
  });

  it('allows finishing interview early via top action button', () => {
    const handleSkipToFacts = vi.fn();
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={1}
        onSkipToFacts={handleSkipToFacts}
      />,
    );

    const finishEarlyBtn = screen.getByText(/Finalizar entrevista antecipadamente/i);
    fireEvent.click(finishEarlyBtn);
    expect(handleSkipToFacts).toHaveBeenCalledTimes(1);
  });

  it('allows answering and moving to next question', () => {
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={1}
      />,
    );

    const textarea = screen.getByPlaceholderText(/Ex: Na migração, sustentamos ~2M req\/dia/i);
    fireEvent.change(textarea, { target: { value: 'Processamos mais de 50M de eventos/dia com Kafka' } });

    const nextBtn = screen.getByText(/Próxima/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Pergunta 2 de 2/i)).toBeDefined();
    expect(screen.getByText(/Qual o maior trade-off de arquitetura na migração\?/i)).toBeDefined();
  });

  it('resets question index to 0 when transitioning from round 1 to round 2 on re-render', () => {
    const { rerender } = render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={1}
      />,
    );

    // Advance to question 2 in round 1
    const textarea = screen.getByPlaceholderText(/Ex: Na migração, sustentamos ~2M req\/dia/i);
    fireEvent.change(textarea, { target: { value: 'Kafka stream processing' } });
    const nextBtn = screen.getByText(/Próxima/i);
    fireEvent.click(nextBtn);
    expect(screen.getByText(/Pergunta 2 de 2/i)).toBeDefined();

    // Now transition to round 2 with a single follow-up question
    const round2Plan: InterviewPlan = {
      questions: [
        {
          id: 'q-deep-1',
          category: 'scale',
          question: 'Qual a estratégia de particionamento e retenção no Kafka?',
          reason: 'Aprofundamento de arquitetura.',
          answerType: 'long-text',
          required: false,
        },
      ],
    };

    rerender(
      <InterviewView
        plan={round2Plan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={2}
      />,
    );

    // Should reset to Question 1 of Round 2 and NOT crash or show "Nenhuma pergunta encontrada"
    expect(screen.queryByText(/Nenhuma pergunta encontrada para esta rodada/i)).toBeNull();
    expect(screen.getByText(/Pergunta 1 de 1/i)).toBeDefined();
    expect(screen.getByText(/Qual a estratégia de particionamento e retenção no Kafka\?/i)).toBeDefined();
  });

  it('renders recovery button if plan has zero questions', () => {
    const handleSkipToFacts = vi.fn();
    render(
      <InterviewView
        plan={{ questions: [] }}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        roundNumber={1}
        onSkipToFacts={handleSkipToFacts}
      />,
    );

    expect(screen.getByText(/Nenhuma pergunta encontrada para esta rodada/i)).toBeDefined();
    const recoverBtn = screen.getByText(/Avançar direto para validação de fatos/i);
    fireEvent.click(recoverBtn);
    expect(handleSkipToFacts).toHaveBeenCalledTimes(1);
  });

  it('renders Elite Polish Mode banner and header when overallScore >= 92', () => {
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={vi.fn()}
        isLoading={false}
        overallScore={94}
      />,
    );

    expect(screen.getByText(/Entrevista técnica \(Modo Lapidação\) — pergunta 1 de 2/i)).toBeDefined();
    expect(screen.getByText(/Modo Lapidação Ativo:/i)).toBeDefined();
    expect(screen.getByText(/Seu perfil já cumpre os requisitos de excelência dos EUA/i)).toBeDefined();
  });

  it('marks question with "Não se aplica ao meu contexto" and submits skipped answer', async () => {
    const handleSubmitAnswers = vi.fn();
    render(
      <InterviewView
        plan={samplePlan}
        onSubmitAnswers={handleSubmitAnswers}
        isLoading={false}
        roundNumber={1}
      />,
    );

    // Click "Não se aplica ao meu contexto" on question 1
    const notApplicableBtn = screen.getByText('Não se aplica ao meu contexto');
    fireEvent.click(notApplicableBtn);

    // Automatically advances to question 2
    expect(screen.getByText(/pergunta 2 de 2/i)).toBeDefined();
    expect(screen.getByText('Qual o maior trade-off de arquitetura na migração?')).toBeDefined();

    // On question 2, answer normally and click finish
    const textarea = screen.getByPlaceholderText(/Ex: Na migração, sustentamos ~2M req\/dia/i);
    fireEvent.change(textarea, { target: { value: 'Optamos por consistência eventual com saga pattern' } });

    const finishBtn = screen.getByText('Finalizar e revisar fatos');
    fireEvent.click(finishBtn);

    expect(handleSubmitAnswers).toHaveBeenCalledWith([
      {
        questionId: 'q1',
        value: 'Não se aplica ao meu contexto',
        skipped: true,
      },
      {
        questionId: 'q2',
        value: 'Optamos por consistência eventual com saga pattern',
        skipped: false,
      },
    ]);
  });
});

