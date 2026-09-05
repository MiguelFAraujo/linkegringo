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

    const beforeBadges = screen.getAllByText(/Antes \(LinkedIn Original\)/i);
    expect(beforeBadges.length).toBeGreaterThanOrEqual(1);

    const afterBadges = screen.getAllByText(/Depois \(Versão dos EUA\)/i);
    expect(afterBadges.length).toBeGreaterThanOrEqual(1);
  });

  it('renders the 5 technical criteria breakdown comparing Before vs After with progress and delta badges', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(screen.getByText(/Breakdown dos 5 Critérios Técnicos \(Antes vs Depois\)/i)).toBeDefined();
    expect(screen.getByText(/5 Pilares Técnicos/i)).toBeDefined();

    // 5 criteria names
    expect(screen.getByText(/Relevância de Busca \(Search Relevance\)/i)).toBeDefined();
    expect(screen.getByText(/Tom de Voz Humano \(Human Voice\)/i)).toBeDefined();
    expect(screen.getByText(/Credibilidade Técnica \(Credibility\)/i)).toBeDefined();
    expect(screen.getByText(/Clareza de Posicionamento \(Positioning Clarity\)/i)).toBeDefined();
    expect(screen.getByText(/Cobertura de Evidências \(Evidence Coverage\)/i)).toBeDefined();

    // Specific deltas:
    // searchRelevance: 95 - 48 = +47 pts
    expect(screen.getByText('+47 pts')).toBeDefined();
    // humanVoice: 92 - 52 = +40 pts
    expect(screen.getByText('+40 pts')).toBeDefined();
    // credibility: 96 - 38 = +58 pts
    expect(screen.getByText('+58 pts')).toBeDefined();
    // positioningClarity: 97 - 35 = +62 pts
    expect(screen.getByText('+62 pts')).toBeDefined();
    // evidenceCoverage: 91 - 37 = +54 pts
    expect(screen.getByText('+54 pts')).toBeDefined();
  });
});

