import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { RecruiterSearchCard } from './RecruiterSearchCard';
import { MOCK_PROFILE } from '@linkegringo/ai';

describe('RecruiterSearchCard Component', () => {
  const rewrittenHeadline = 'Senior Distributed Systems & Backend Engineer | Java & Kafka';

  it('renders LinkedIn Recruiter search card header and Antes vs Depois snippets when profile is unoptimized', () => {
    render(
      <RecruiterSearchCard
        originalProfile={MOCK_PROFILE}
        rewrittenHeadline={rewrittenHeadline}
        primaryRole="Senior Backend Engineer"
      />,
    );

    expect(screen.getByText(/Card de Busca no LinkedIn Recruiter \(Antes vs Depois\)/i)).toBeDefined();
    expect(screen.getByText(/Antes \(LinkedIn Original\)/i)).toBeDefined();
    expect(screen.getByText(/Depois \(LinkedIn Recruiter Ready\)/i)).toBeDefined();
    expect(screen.getByText(/Snippet Cortado/i)).toBeDefined();
    expect(screen.getByText(/Por que o recrutador ignora:/i)).toBeDefined();
    expect(screen.getByText(/Por que este snippet funciona:/i)).toBeDefined();
    expect(screen.getByText(/Por que este snippet favorece uma abordagem do recruiter:/i)).toBeDefined();
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

    expect(screen.getByText(/Por que este snippet funciona:/i)).toBeDefined();
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

  it('renders unified Spotlight Recruiter Card with full width when original headline is already Recruiter-Ready', () => {
    const alreadyOptimizedHeadline =
      'Senior Full Stack Engineer | Node.js, NestJS, TypeScript, React | 7M+ Req/Mo Scale | US Remote';
    const profileWithOptimizedHeadline = {
      ...MOCK_PROFILE,
      headline: alreadyOptimizedHeadline,
    };

    render(
      <RecruiterSearchCard
        originalProfile={profileWithOptimizedHeadline}
        rewrittenHeadline={alreadyOptimizedHeadline}
        primaryRole="Senior Full Stack Engineer"
      />,
    );

    // Should NOT render split comparison cards
    expect(screen.queryByText(/Snippet Cortado/i)).toBeNull();
    expect(screen.queryByText(/Antes \(LinkedIn Original\)/i)).toBeNull();
    expect(screen.queryByText(/Depois \(LinkedIn Recruiter Ready\)/i)).toBeNull();
    expect(screen.queryByText(/Por que o recrutador ignora:/i)).toBeNull();

    // Should render unified Spotlight view
    expect(screen.getByText(/Card de Busca no LinkedIn Recruiter \(Recruiter-Ready\)/i)).toBeDefined();
    expect(screen.getByText(/Seu Perfil no LinkedIn Recruiter \(Recruiter-Ready\)/i)).toBeDefined();
    expect(screen.getByText('Recruiter-Ready')).toBeDefined();
    expect(screen.getByText(/Por que este snippet funciona:/i)).toBeDefined();
    expect(screen.getByText(/Por que este snippet favorece uma abordagem do recruiter:/i)).toBeDefined();
  });
});
