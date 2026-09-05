import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { DiagnosticView } from './DiagnosticView';
import { MOCK_PROFILE, MOCK_REVIEW } from '@linkegringo/ai';

describe('DiagnosticView Component', () => {
  it('renders standard diagnostic for typical profile (score 42)', () => {
    const handleProceed = vi.fn();
    render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={MOCK_REVIEW}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('42')).toBeDefined();
    expect(screen.queryByText(/Perfil Aprovado para Vagas nos EUA/i)).toBeNull();
    expect(screen.getByText(/Otimizar Perfil/i)).toBeDefined();
    expect(screen.getByText(/Avançar para a entrevista/i)).toBeDefined();
  });

  it('does NOT render celebratory banner when score is 91 (under 92 cutoff)', () => {
    const handleProceed = vi.fn();
    const score91Review = {
      ...MOCK_REVIEW,
      overallScore: 91,
    };

    render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={score91Review}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('91')).toBeDefined();
    expect(screen.queryByText(/Perfil Aprovado para Vagas nos EUA/i)).toBeNull();
    expect(screen.getByText(/Otimizar Perfil/i)).toBeDefined();
  });

  it('renders celebratory banner and badge for optimized profile (score >= 92)', () => {
    const handleProceed = vi.fn();
    const highReview = {
      ...MOCK_REVIEW,
      overallScore: 92,
      scores: {
        searchRelevance: 95,
        humanVoice: 94,
        credibility: 90,
        positioningClarity: 92,
        evidenceCoverage: 89,
      },
      executiveSummary: 'Perfil no padrão internacional de excelência para os EUA!',
      critique: [
        {
          section: 'Headline',
          assessment: 'Headline **muito clara** com `Kafka` e escala.',
          strengths: ['Contém **métricas reais** comprovadas'],
          issues: ['Falta adicionar `p99 latency`'],
          severity: 'low' as const,
        },
      ],
    };

    const { container } = render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={highReview}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('92')).toBeDefined();
    // Celebratory badge and banner should be present
    const approvedBadges = screen.getAllByText(/Perfil Aprovado para Vagas nos EUA/i);
    expect(approvedBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Seu perfil já cumpre os padrões de contratação dos EUA/i)).toBeDefined();
    expect(screen.getByText(/Lapidar Perfil/i)).toBeDefined();
    expect(screen.getByText(/Lapidar Detalhes & Avançar/i)).toBeDefined();

    // Verify FormattedText rendered markdown tokens in critique
    const strongTexts = Array.from(container.querySelectorAll('strong')).map((el) => el.textContent);
    expect(strongTexts).toContain('muito clara');
    expect(container.querySelector('code')?.textContent).toBe('Kafka');

    const proceedBtn = screen.getByText(/Lapidar Detalhes & Avançar/i);
    fireEvent.click(proceedBtn);
    expect(handleProceed).toHaveBeenCalledTimes(1);
  });

  it('renders "Sem Red Flags" badge when critique section has zero issues', () => {
    const handleProceed = vi.fn();
    const cleanReview = {
      ...MOCK_REVIEW,
      critique: [
        {
          section: 'Headline',
          assessment: 'Headline precisa e alinhada ao cargo sênior.',
          strengths: ['Stack core bem definida', 'Senioridade explícita'],
          issues: [],
          severity: 'low' as const,
        },
      ],
    };

    render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={cleanReview}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('Sem Red Flags')).toBeDefined();
    expect(screen.queryByText('Leve')).toBeNull();
    expect(screen.queryByText('Red Flags Identificadas:')).toBeNull();
    expect(screen.getByText('Pontos Fortes:')).toBeDefined();
  });

  it('renders real severity badges ("Grave", "Moderado", "Leve") and "Red Flags Identificadas:" when issues exist', () => {
    const handleProceed = vi.fn();
    const reviewWithMixedIssues = {
      ...MOCK_REVIEW,
      critique: [
        {
          section: 'Headline',
          assessment: 'Título com buzzwords.',
          strengths: [],
          issues: ['Contém "Passionate" e "Ninja"'],
          severity: 'high' as const,
        },
        {
          section: 'About / Summary',
          assessment: 'Resumo com pouca densidade.',
          strengths: [],
          issues: ['Falta hook técnico'],
          severity: 'medium' as const,
        },
        {
          section: 'Experiences',
          assessment: 'Pequenos ajustes de métricas.',
          strengths: [],
          issues: ['Falta adicionar latência p99 em 1 bullet'],
          severity: 'low' as const,
        },
      ],
    };

    render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={reviewWithMixedIssues}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('Grave')).toBeDefined();
    expect(screen.getByText('Moderado')).toBeDefined();
    expect(screen.getByText('Leve')).toBeDefined();
    expect(screen.getAllByText('Red Flags Identificadas:').length).toBe(3);
    expect(screen.queryByText('Pontos Fracos:')).toBeNull();
  });

  it('safely handles undefined issues and strengths, rendering "Sem Red Flags" badge even if raw severity is high', () => {
    const handleProceed = vi.fn();
    const edgeCaseReview = {
      ...MOCK_REVIEW,
      critique: [
        {
          section: 'Headline',
          assessment: 'Headline técnica direta.',
          strengths: undefined,
          issues: undefined,
          severity: 'high' as const,
        },
      ],
    };

    render(
      <DiagnosticView
        profile={MOCK_PROFILE}
        review={edgeCaseReview as any}
        onProceedToObjective={handleProceed}
      />,
    );

    expect(screen.getByText('Sem Red Flags')).toBeDefined();
    expect(screen.queryByText('Grave')).toBeNull();
    expect(screen.queryByText('Red Flags Identificadas:')).toBeNull();
  });
});

