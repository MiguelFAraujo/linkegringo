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

  it('renders celebratory banner and badge for optimized profile (score >= 88)', () => {
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
    };

    render(
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

    const proceedBtn = screen.getByText(/Lapidar Detalhes & Avançar/i);
    fireEvent.click(proceedBtn);
    expect(handleProceed).toHaveBeenCalledTimes(1);
  });
});
