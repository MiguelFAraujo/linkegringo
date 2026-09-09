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
    triageBottlenecks: [],
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

  it('renders score evolution (42 to 94) and candidate avatar', () => {
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
    expect(screen.getByText('+52 pontos')).toBeDefined();

    // Verify CandidateAvatar rendering with fictional demo avatar
    const avatarImg = screen.getByRole('img');
    expect(avatarImg.getAttribute('src')).toBe('/demo-avatar.svg');
    expect(avatarImg.getAttribute('alt')).toBe('Foto de perfil de Alexandre Rocha');
  });

  it('renders the 5-minute interactive LinkedIn checklist with 6 LinkedIn Recruiter actions and working checkboxes', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(screen.getByText(/Passos para atualizar o LinkedIn/i)).toBeDefined();
    expect(screen.getByText(/0 \/ 6 concluídos/i)).toBeDefined();

    // Verify presence of all 6 recruiter actions
    expect(screen.getByText(/1\. Atualize Headline e About no LinkedIn/i)).toBeDefined();
    expect(screen.getByText(/2\. Atualize os Bullets das Experiências/i)).toBeDefined();
    expect(screen.getByText(/3\. Ative "Open to Work" Invisível/i)).toBeDefined();
    expect(screen.getByText(/4\. Crie o Perfil Secundário em Inglês/i)).toBeDefined();
    expect(screen.getByText(/5\. Vincule experiências às Páginas Oficiais/i)).toBeDefined();
    expect(screen.getByText(/6\. Configure Seção em Destaque & Top Skills/i)).toBeDefined();

    const headlineCheckbox = screen.getByText(/1\. Atualize Headline e About no LinkedIn/i);
    fireEvent.click(headlineCheckbox);

    expect(screen.getByText(/1 \/ 6 concluídos/i)).toBeDefined();
  });

  it('renders the technical interview preparation guide card', () => {
    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/Preparação para Entrevistas nos EUA/i),
    ).toBeDefined();
    expect(screen.getByText(/Guia de Preparação Técnica/i)).toBeDefined();
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

  it('renders zero and negative deltas cleanly without +- formatting for high-scoring initial profiles', () => {
    const highInitialReview = {
      ...MOCK_REVIEW,
      overallScore: 94,
      scores: {
        searchRelevance: 95,
        humanVoice: 95,
        credibility: 96,
        positioningClarity: 97,
        evidenceCoverage: 91,
      },
    };

    render(
      <ActionHubView
        originalProfile={MOCK_PROFILE}
        initialReview={highInitialReview}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    // Initial 94, new 94 -> 0 pts (matches hero and multiple criteria)
    const zeroBadges = screen.getAllByText('0 pts');
    expect(zeroBadges.length).toBeGreaterThanOrEqual(1);
    // humanVoice: 92 - 95 = -3 pts (never +-3 pts)
    expect(screen.getByText('-3 pts')).toBeDefined();
    expect(screen.queryByText('+-3 pts')).toBeNull();
  });

  it('renders original experience description in the Antes column when present', () => {
    const profileWithDescription = {
      ...MOCK_PROFILE,
      experiences: [
        {
          title: 'Senior Software Engineer',
          companyName: 'Fintech Pagamentos Brasil',
          description: 'Responsavel pela manutencao de microsservicos legados em Java e Spring.',
          current: false,
        },
      ],
    };

    render(
      <ActionHubView
        originalProfile={profileWithDescription}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    // Switch to experiences tab
    const expTab = screen.getByRole('tab', { name: /Experiências/i });
    fireEvent.click(expTab);

    expect(screen.getByText('Responsavel pela manutencao de microsservicos legados em Java e Spring.')).toBeDefined();
  });

  it('renders informative message when original experience description is absent', () => {
    const profileWithoutDescription = {
      ...MOCK_PROFILE,
      experiences: [
        {
          title: 'Senior Software Engineer',
          companyName: 'Fintech Pagamentos Brasil',
          description: '',
          current: false,
        },
      ],
    };

    render(
      <ActionHubView
        originalProfile={profileWithoutDescription}
        initialReview={MOCK_REVIEW}
        analysis={sampleAnalysis}
        onStartNew={vi.fn()}
      />,
    );

    const expTab = screen.getByRole('tab', { name: /Experiências/i });
    fireEvent.click(expTab);

    expect(
      screen.getByText(/Cargo cadastrado sem descrição ou bullets no perfil original do LinkedIn/i),
    ).toBeDefined();
  });
});


