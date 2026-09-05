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

    expect(screen.getByText(/Entrevista de Coaching Técnico • Rodada 1/i)).toBeDefined();
    expect(screen.getByText(/Qual o volume de transações com Kafka\?/i)).toBeDefined();
    expect(screen.getByText(/Por que recrutadores gringos querem saber disso\?/i)).toBeDefined();
    expect(screen.getByText(/Pergunta 1 de 2/i)).toBeDefined();
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

    const textarea = screen.getByPlaceholderText(/Ex: Na migração, lidamos com ~2M req\/dia/i);
    fireEvent.change(textarea, { target: { value: 'Processamos mais de 50M de eventos/dia com Kafka' } });

    const nextBtn = screen.getByText(/Próxima/i);
    fireEvent.click(nextBtn);

    expect(screen.getByText(/Pergunta 2 de 2/i)).toBeDefined();
    expect(screen.getByText(/Qual o maior trade-off de arquitetura na migração\?/i)).toBeDefined();
  });
});
