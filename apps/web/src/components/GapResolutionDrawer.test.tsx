import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { GapResolutionDrawer } from './GapResolutionDrawer';
import type { ProfileAnalysis, SearchGap, AiProvider } from '@linkegringo/core';

describe('GapResolutionDrawer Component', () => {
  const mockAnalysis: ProfileAnalysis = {
    targetMarket: 'United States',
    language: 'en',
    executiveSummary: 'Senior Backend Engineer specialized in distributed systems and high scale.',
    profileDirection: {
      positioning: 'Senior Backend Engineer | Distributed Systems & High Scale',
      primaryRole: 'Senior Backend Engineer',
      alternativeRoles: ['Distributed Systems Engineer', 'Staff Backend Engineer'],
      rationale: 'Positioning anchored on verified production scope.',
    },
    scores: {
      searchRelevance: 75,
      humanVoice: 80,
      credibility: 85,
      positioningClarity: 80,
      evidenceCoverage: 70,
    },
    overallScore: 78,
    initialScore: 65,
    critique: [],
    triageBottlenecks: [],
    rewritten: {
      headline: 'Senior Backend Engineer | Java & Cloud',
      summary: 'Experienced distributed systems engineer with 8+ years building high-throughput services.',
      skills: ['Java', 'Distributed Systems', 'AWS', 'Docker', 'PostgreSQL'],
      cardConversionBadges: ['✓ Senioridade clara', '✓ Stack de alta busca'],
      cardConversionReasons: ['Strong positioning for US remote recruiters.'],
      experiences: [
        {
          id: 'exp-1',
          title: 'Senior Backend Engineer',
          companyName: 'Fintech Corp',
          bullets: [
            'Architected microservices handling 10k rps with 99.9% uptime.',
            'Optimized relational database queries reducing p95 latency by 40%.',
          ],
        },
      ],
    },
  };

  const techGap: SearchGap = {
    id: 'gap-kafka',
    term: 'Kafka',
    status: 'missing',
    kind: 'technology',
    targetSection: 'experience',
    targetExperienceId: 'exp-1',
  };

  const roleGap: SearchGap = {
    id: 'gap-staff',
    term: 'Staff Engineer',
    status: 'weak',
    kind: 'role',
    targetSection: 'headline',
  };

  it('renders validation question for technology gap when opened', () => {
    render(
      <GapResolutionDrawer
        open={true}
        onOpenChange={vi.fn()}
        gap={techGap}
        analysis={mockAnalysis}
        targetRole="Senior Backend Engineer"
        onApplyPatch={vi.fn()}
      />,
    );

    expect(screen.getByText(/Validação Factual Obrigatória/i)).toBeDefined();
    expect(screen.getByText(/Você já utilizou "Kafka" em ambiente de produção\?/i)).toBeDefined();
    expect(screen.getByRole('button', { name: /Sim, usei em produção/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Não usei em produção/i })).toBeDefined();
  });

  it('renders scope verification question for role gap', () => {
    render(
      <GapResolutionDrawer
        open={true}
        onOpenChange={vi.fn()}
        gap={roleGap}
        analysis={mockAnalysis}
        targetRole="Staff Backend Engineer"
        onApplyPatch={vi.fn()}
      />,
    );

    expect(
      screen.getByText(/A posição de "Staff Engineer" é compatível com o escopo que você realmente exerceu\?/i),
    ).toBeDefined();
    expect(screen.getByRole('button', { name: /Sim, exerci esse escopo/i })).toBeDefined();
    expect(screen.getByRole('button', { name: /Não exerci esse escopo/i })).toBeDefined();
  });

  it('handles "Não usei em produção" path with zero hallucination and shows real profile competencies', () => {
    const handleOpenChange = vi.fn();
    const handleApplyPatch = vi.fn();

    render(
      <GapResolutionDrawer
        open={true}
        onOpenChange={handleOpenChange}
        gap={techGap}
        analysis={mockAnalysis}
        onApplyPatch={handleApplyPatch}
      />,
    );

    const denyButton = screen.getByRole('button', { name: /Não usei em produção/i });
    fireEvent.click(denyButton);

    // Displays factual posture view
    expect(screen.getByText(/Postura Correta de Engenharia/i)).toBeDefined();
    expect(screen.getByText(/Experiência não confirmada preserva sua credibilidade/i)).toBeDefined();
    expect(screen.getByText(/Competências e tecnologias reais já presentes no seu perfil:/i)).toBeDefined();
    expect(screen.getByText('PostgreSQL')).toBeDefined();

    // Closing without mutating
    const closeButton = screen.getByRole('button', { name: /Entendido, manter perfil factual/i });
    fireEvent.click(closeButton);

    expect(handleOpenChange).toHaveBeenCalledWith(false);
    expect(handleApplyPatch).not.toHaveBeenCalled();
  });

  it('completes the full loop: "Sim, usei" -> evidence input -> generate proposal -> apply patch', async () => {
    const handleOpenChange = vi.fn();
    const handleApplyPatch = vi.fn();

    const mockAiProvider: AiProvider = {
      id: 'mock-ai',
      name: 'Mock AI',
      testConnection: vi.fn().mockResolvedValue(true),
      parseAndDiagnose: vi.fn(),
      generateInterview: vi.fn(),
      evaluateProgress: vi.fn(),
      generateRewrittenProfile: vi.fn(),
      generateMicroIntegration: vi.fn().mockResolvedValue({
        status: 'ready',
        patchKind: 'experience_rewrite',
        term: 'Kafka',
        target: { section: 'experience', experienceId: 'exp-1' },
        before: 'Architected microservices handling 10k rps with 99.9% uptime.',
        after: 'Architected microservices with Apache Kafka pipelines handling 10k rps with 99.9% uptime.',
        rationale: 'Integrated Kafka into production pipeline bullet with verifiable metrics.',
        matchedEvidence: 'Integrated Kafka for 10k rps event streaming',
        warnings: [],
      }),
    };

    render(
      <GapResolutionDrawer
        open={true}
        onOpenChange={handleOpenChange}
        gap={techGap}
        analysis={mockAnalysis}
        aiProvider={mockAiProvider}
        onApplyPatch={handleApplyPatch}
      />,
    );

    // 1. Confirm usage
    const confirmButton = screen.getByRole('button', { name: /Sim, usei em produção/i });
    fireEvent.click(confirmButton);

    // 2. Evidence input step
    expect(screen.getByText(/1\. Em qual experiência você utilizou Kafka\?/i)).toBeDefined();
    const textarea = screen.getByPlaceholderText(/Ex: Implementei pipelines de mensageria com Kafka/i);

    fireEvent.change(textarea, {
      target: { value: 'Integrated Kafka for 10k rps event streaming in payments' },
    });

    // 3. Generate proposal
    const generateBtn = screen.getByRole('button', { name: /Gerar integração com IA →/i });
    fireEvent.click(generateBtn);

    // 4. Wait for proposal diff view
    await waitFor(() => {
      expect(screen.getByText(/Proposta Gerada no Framework XYZ/i)).toBeDefined();
    });

    expect(screen.getByText(/Integrated Kafka into production pipeline bullet/i)).toBeDefined();
    expect(screen.getByText('Architected microservices handling 10k rps with 99.9% uptime.')).toBeDefined();
    expect(
      screen.getByText(
        'Architected microservices with Apache Kafka pipelines handling 10k rps with 99.9% uptime.',
      ),
    ).toBeDefined();

    // 5. Apply patch
    const applyButton = screen.getByRole('button', { name: /Aplicar alteração no Perfil ✓/i });
    fireEvent.click(applyButton);

    // 6. Verify that onApplyPatch was called with updated analysis and exact diff
    expect(handleApplyPatch).toHaveBeenCalledTimes(1);
    const appliedCall = handleApplyPatch.mock.calls[0][0];
    expect(appliedCall.diff.after).toContain('Apache Kafka');
    expect(appliedCall.analysis.rewritten.experiences[0].bullets[0]).toBe(
      'Architected microservices with Apache Kafka pipelines handling 10k rps with 99.9% uptime.',
    );
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('renders resolved-view mode when opened with resolvedDiff', () => {
    const resolvedDiff = {
      before: 'Old bullet text',
      after: 'New bullet text with Kafka',
      evidenceText: 'Used Kafka in payments',
      companyName: 'Fintech Corp',
    };

    render(
      <GapResolutionDrawer
        open={true}
        onOpenChange={vi.fn()}
        gap={techGap}
        analysis={mockAnalysis}
        onApplyPatch={vi.fn()}
        resolvedDiff={resolvedDiff}
      />,
    );

    expect(screen.getByText(/Termo indexado com sucesso/i)).toBeDefined();
    expect(screen.getByText(/Used Kafka in payments/i)).toBeDefined();
    expect(screen.getByText('Old bullet text')).toBeDefined();
    expect(screen.getByText('New bullet text with Kafka')).toBeDefined();
    expect(screen.getByText(/Fintech Corp/i)).toBeDefined();
  });
});
