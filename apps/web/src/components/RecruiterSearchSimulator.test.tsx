import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { RecruiterSearchSimulator } from './RecruiterSearchSimulator';

describe('RecruiterSearchSimulator Component', () => {
  const defaultProps = {
    primaryRole: 'Senior Backend Engineer',
    rewrittenHeadline: 'Senior Distributed Systems & Backend Engineer | Java & Kafka',
    rewrittenSummary: 'Experienced backend specialist in event-driven architecture and high scale.',
    rewrittenSkills: ['Java', 'Kafka', 'Distributed Systems', 'AWS'],
    rewrittenExperiences: [
      {
        title: 'Senior Backend Engineer',
        companyName: 'Fintech Brasil',
        bullets: ['Architected microservices handling 20,000 rps with 80ms p99 latency.'],
      },
    ],
  };

  it('renders simulator title, preset recruiter queries, and algorithmic tip', () => {
    render(<RecruiterSearchSimulator {...defaultProps} />);

    expect(screen.getByText(/Simulador de Busca do Recrutador/i)).toBeDefined();
    expect(screen.getByText(/Dica de Algoritmo do LinkedIn Recruiter/i)).toBeDefined();
    expect(screen.getByText(/Queries padrão de tech recruiters/i)).toBeDefined();
  });

  it('correctly categorizes terms into MATCH, WEAK, and MISSING zones', () => {
    render(<RecruiterSearchSimulator {...defaultProps} />);

    // Test with custom query containing a headline term (Java), a deep bullet term (latency), and a missing term (Blockchain)
    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Java AND latency AND Blockchain' } });

    // "Java" is in headline and skills -> MATCH
    // "latency" is in bullet -> WEAK
    // "Blockchain" is not in profile -> MISSING
    expect(screen.getAllByText('MATCH').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('WEAK')).toBeDefined();
    expect(screen.getByText('MISSING')).toBeDefined();
  });

  it('allows clicking preset queries to instantly calibrate the search', () => {
    render(<RecruiterSearchSimulator {...defaultProps} />);

    const presetBtn2 = screen.getByText(/#2:/i);
    fireEvent.click(presetBtn2);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i) as HTMLInputElement;
    expect(input.value).toContain('title:("Senior Backend Engineer")');
  });

  it('supports short tech terms like Go and C# without dropping them', () => {
    const propsWithGo = {
      ...defaultProps,
      rewrittenHeadline: 'Senior Backend Engineer | Go, Docker, Kubernetes',
      rewrittenSkills: ['Go', 'Docker', 'Kubernetes'],
    };
    render(<RecruiterSearchSimulator {...propsWithGo} />);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Go AND Kubernetes' } });

    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('Kubernetes')).toBeDefined();
    // 2 matches in breakdown
    expect(screen.getByText(/2 Match\(es\) • 0 Parcial\(is\)/i)).toBeDefined();
  });

  it('does NOT false-match Go inside MongoDB or Java inside JavaScript', () => {
    const propsWithMongo = {
      ...defaultProps,
      rewrittenHeadline: 'Senior Backend Engineer | JavaScript, MongoDB, Node.js',
      rewrittenSummary: 'Backend engineering with MongoDB database and JavaScript APIs.',
      rewrittenSkills: ['JavaScript', 'MongoDB', 'Node.js'],
    };
    render(<RecruiterSearchSimulator {...propsWithMongo} />);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Go AND Java' } });

    // Neither Go nor Java is in this profile, despite MongoDB containing "go" and JavaScript containing "java"
    expect(screen.getByText('Go')).toBeDefined();
    expect(screen.getByText('Java')).toBeDefined();
    expect(screen.getByText(/0 Match\(es\) • 0 Parcial\(is\)/i)).toBeDefined();
    expect(screen.getAllByText('MISSING').length).toBe(2);
  });

  it('handles unmatched quotes and comma-separated lists gracefully', () => {
    render(<RecruiterSearchSimulator {...defaultProps} />);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    // User typing an unclosed quote: "Senior Backend Engineer
    fireEvent.change(input, { target: { value: '"Senior Backend Engineer' } });

    expect(screen.getByText('Senior Backend Engineer')).toBeDefined();

    // Comma-separated query: Java, Kafka, AWS
    fireEvent.change(input, { target: { value: 'Java, Kafka, AWS' } });
    expect(screen.getByText('Java')).toBeDefined();
    expect(screen.getByText('Kafka')).toBeDefined();
    expect(screen.getByText('AWS')).toBeDefined();
    expect(screen.getByText(/3 Match\(es\) • 0 Parcial\(is\)/i)).toBeDefined();
  });

  it('renders "Integrar no Perfil →" button for MISSING terms and calls onIntegrateGap with structured SearchGap', () => {
    const handleIntegrateGap = vi.fn();
    render(<RecruiterSearchSimulator {...defaultProps} onIntegrateGap={handleIntegrateGap} />);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Java AND GraphQL' } });

    // "GraphQL" is MISSING
    expect(screen.getByText('GraphQL')).toBeDefined();
    const integrateButton = screen.getByRole('button', { name: /Integrar no Perfil →/i });
    expect(integrateButton).toBeDefined();

    fireEvent.click(integrateButton);
    expect(handleIntegrateGap).toHaveBeenCalledTimes(1);
    expect(handleIntegrateGap).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gap-graphql',
        term: 'GraphQL',
        status: 'missing',
        kind: 'concept',
        targetSection: 'experience',
      }),
    );
  });

  it('renders "Integrar no Perfil →" and falls back to onFixGap with structured ProfileGap when onIntegrateGap is not provided', () => {
    const handleFixGap = vi.fn();
    render(<RecruiterSearchSimulator {...defaultProps} onFixGap={handleFixGap} />);

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Java AND GraphQL' } });

    const fixButton = screen.getByRole('button', { name: /Integrar no Perfil →/i });
    expect(fixButton).toBeDefined();

    fireEvent.click(fixButton);
    expect(handleFixGap).toHaveBeenCalledTimes(1);
    expect(handleFixGap).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'gap-graphql',
        label: 'Corrigir termo ausente: GraphQL',
        targetSection: 'experience',
      }),
    );
  });

  it('renders "Ver alteração" button when a term is a MATCH and was resolved in the session', () => {
    const handleViewResolvedGap = vi.fn();
    const resolvedGapMetadata = {
      kafka: {
        before: 'Implemented messaging systems.',
        after: 'Architected Apache Kafka event pipelines processing 20k msg/s.',
        evidenceText: 'Used Kafka with schema registry in production',
        companyName: 'Fintech Brasil',
      },
    };

    render(
      <RecruiterSearchSimulator
        {...defaultProps}
        onViewResolvedGap={handleViewResolvedGap}
        resolvedGapMetadata={resolvedGapMetadata}
      />,
    );

    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: 'Kafka' } });

    // Kafka is a MATCH and is in resolvedGapMetadata
    const viewButton = screen.getByRole('button', { name: /Ver alteração/i });
    expect(viewButton).toBeDefined();

    fireEvent.click(viewButton);
    expect(handleViewResolvedGap).toHaveBeenCalledTimes(1);
    expect(handleViewResolvedGap).toHaveBeenCalledWith(
      expect.objectContaining({
        term: 'Kafka',
      }),
    );
  });

  it('matches hyphenated "high-scale" in experience when recruiter searches for "High Scale"', () => {
    const propsWithHyphenated = {
      ...defaultProps,
      rewrittenExperiences: [
        {
          id: 'exp-0',
          title: 'Senior Backend Engineer',
          companyName: 'Fintech Corp',
          bullets: [
            'Engineered high-scale enterprise modules for financial reconciliation.',
          ],
        },
      ],
    };

    render(<RecruiterSearchSimulator {...propsWithHyphenated} />);
    const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
    fireEvent.change(input, { target: { value: '"High Scale"' } });

    expect(screen.getByText('High Scale')).toBeDefined();
    expect(screen.getByText(/0 Match\(es\) • 1 Parcial\(is\)/i)).toBeDefined();
    expect(screen.getByText('WEAK')).toBeDefined();
    expect(screen.getByText('Summary / Bullets')).toBeDefined();
  });
});
