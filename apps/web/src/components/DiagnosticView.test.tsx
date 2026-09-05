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
    expect(screen.queryByText(/🎉 Perfil Nível Gringo Aprovado/i)).toBeNull();
    expect(screen.getByText(/Otimizar Perfil/i)).toBeDefined();
    expect(screen.getByText(/Definir Objetivo & Avançar/i)).toBeDefined();
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
    expect(screen.queryByText(/🎉 Perfil Nível Gringo Aprovado/i)).toBeNull();
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
      executiveSummary: '🎉 Perfil no padrão internacional de excelência para os EUA!',
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
    const approvedBadges = screen.getAllByText(/🎉 Perfil Nível Gringo Aprovado/i);
    expect(approvedBadges.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Seu perfil já cumpre os padrões de contratação dos EUA!/i)).toBeDefined();
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
});
