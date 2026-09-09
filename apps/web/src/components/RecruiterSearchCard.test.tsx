import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RecruiterSearchCard } from './RecruiterSearchCard';
import { MOCK_PROFILE } from '@linkegringo/ai';

describe('RecruiterSearchCard Component', () => {
  const rewrittenHeadline = 'Senior Distributed Systems & Backend Engineer | Java & Kafka';

  it('renders LinkedIn Recruiter search card header and Antes vs Depois snippets', () => {
    render(
      <RecruiterSearchCard
        originalProfile={MOCK_PROFILE}
        rewrittenHeadline={rewrittenHeadline}
        primaryRole="Senior Backend Engineer"
      />,
    );

    expect(screen.getByText(/Card de Busca no LinkedIn Recruiter \(Antes vs Depois\)/i)).toBeDefined();
    expect(screen.getByText(/Antes \(LinkedIn Original • Baixo CTR\)/i)).toBeDefined();
    expect(screen.getByText(/Depois \(LinkedIn Recruiter Ready • Alto CTR\)/i)).toBeDefined();
    expect(screen.getByText(/Snippet Cortado/i)).toBeDefined();
    expect(screen.getByText(/Alta Conversão/i)).toBeDefined();
  });

  it('renders default conversion badges and reasons from core deriveCardConversionBadges', () => {
    render(
      <RecruiterSearchCard
        originalProfile={MOCK_PROFILE}
        rewrittenHeadline={rewrittenHeadline}
        primaryRole="Senior Backend Engineer"
      />,
    );

    expect(screen.getByText('Cargo semântico')).toBeDefined();
    expect(screen.getByText('Stack de alta busca')).toBeDefined();
    expect(screen.getByText('Senioridade clara')).toBeDefined();

    expect(screen.getByText(/Por que isso converte em InMail:/i)).toBeDefined();
    expect(
      screen.getByText(/Alinhado diretamente com o filtro de "Current Job Title" mais utilizado por tech recruiters dos EUA/i),
    ).toBeDefined();
  });

  it('supports custom conversion badges and reasons passed via props', () => {
    const customBadges = ['Filtro Booleano L5', 'Stack Core 60 Chars'];
    const customReasons = [
      'Razão customizada: Termos estratégicos de alta prioridade indexados sem corte.',
    ];

    render(
      <RecruiterSearchCard
        originalProfile={MOCK_PROFILE}
        rewrittenHeadline={rewrittenHeadline}
        badges={customBadges}
        reasons={customReasons}
      />,
    );

    expect(screen.getByText('Filtro Booleano L5')).toBeDefined();
    expect(screen.getByText('Stack Core 60 Chars')).toBeDefined();
    expect(screen.getByText(/Razão customizada: Termos estratégicos de alta prioridade/i)).toBeDefined();
  });
});
