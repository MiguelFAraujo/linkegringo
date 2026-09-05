import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ActionHubView } from './ActionHubView';
import { MOCK_PROFILE, MOCK_REVIEW } from '@linkegringo/ai';

// Mock confetti and clipboard
vi.mock('@/lib/file-utils', () => ({
  fireConfetti: vi.fn(),
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('ActionHubView Component', () => {
  const sampleAnalysis = {
    targetMarket: 'United States',
    language: 'en',
    initialScore: 42,
    overallScore: 94,
    scores: {
      searchRelevance: 95,
      humanVoice: 92,
      credibility: 96,
      positioningClarity: 97,
      evidenceCoverage: 91,
    },
    executiveSummary: 'Perfil transformado com sucesso para o mercado americano!',
    profileDirection: {
      positioning: 'Senior Backend Engineer',
      primaryRole: 'Senior Backend Engineer',
      alternativeRoles: [],
      rationale: 'Foco em sistemas distribuídos',
    },
    critique: [],
    rewritten: {
      headline: 'Senior Distributed Systems & Backend Engineer | Java & Kafka',
      summary: 'Senior Backend Engineer with 6+ years designing scalable systems.',
      experiences: [
        {
          title: 'Senior Software Engineer',
          companyName: 'Fintech Pagamentos Brasil',
          bullets: [
            'Architected event-driven microservices reducing p99 latency to 80ms.',
          ],
        },
      ],
      skills: ['Java', 'Spring Boot', 'Kafka', 'Distributed Systems'],
    },
  };

  it('renders score evolution (42 to 94)', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(screen.getByText('42')).toBeDefined();
    expect(screen.getByText('94')).toBeDefined();
    expect(screen.getByText('+52 pts')).toBeDefined();
  });

  it('renders the 5-minute interactive LinkedIn checklist with working checkboxes', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(screen.getByText(/Checklist de 5 Minutos no LinkedIn/i)).toBeDefined();
    expect(screen.getByText(/0 \/ 5 concluídos/i)).toBeDefined();

    const headlineCheckbox = screen.getByText(/1\. Atualize sua Headline no LinkedIn/i);
    fireEvent.click(headlineCheckbox);

    expect(screen.getByText(/1 \/ 5 concluídos/i)).toBeDefined();
  });

  it('renders the Anti-Prolix Framework pocket guide card', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Próximo Passo: Como Mandar Bem nas Entrevistas da Gringa/i),
    ).toBeDefined();
    expect(screen.getByText(/Guia de Bolso Anti-Prolixo/i)).toBeDefined();
    expect(screen.getByText(/1\. Context/i)).toBeDefined();
    expect(screen.getByText(/2\. Problem/i)).toBeDefined();
    expect(screen.getByText(/3\. Action/i)).toBeDefined();
    expect(screen.getByText(/4\. Result/i)).toBeDefined();
  });

  it('renders Before vs After in the headline and about tabs', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(screen.getByText(/Antes \(LinkedIn Original\)/i)).toBeDefined();
    expect(screen.getByText(/Depois \(Versão dos EUA\)/i)).toBeDefined();
  });
});
