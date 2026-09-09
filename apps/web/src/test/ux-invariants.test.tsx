import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import React from 'react';
import { DiagnosticView } from '../components/DiagnosticView';
import { ActionHubView } from '../components/ActionHubView';
import { MOCK_PROFILE, MOCK_REVIEW } from '@linkegringo/ai';
import {
  calculateInboundReadiness,
  rawInboundReadiness,
  calculateInboundJourney,
  stabilizeInboundReadiness,
  getInboundReadinessClassification,
  weakProfileScores,
  strongProfileScores,
  boundaryProfileScores,
  inboundJourneySchema,
  inboundStageSchema,
  profileGapSchema,
  type ProfileAnalysis,
} from '@linkegringo/core';
import { getRecentEvents, clearTelemetry } from '@/lib/telemetry';

// Mock clipboard and confetti
vi.mock('@/lib/file-utils', () => ({
  fireConfetti: vi.fn(),
  copyToClipboard: vi.fn().mockResolvedValue(true),
}));

describe('UX Invariants Verification', () => {
  const sampleAnalysis: ProfileAnalysis = {
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
      skills: ['Java', 'Kafka', 'Distributed Systems'],
    },
  };

  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  describe('Invariant 1 & 2 & 3: Step 2 Minimal Viewport (DiagnosticView)', () => {
    it('renders exactly 1 public overall score (Inbound Readiness)', () => {
      const handleProceed = vi.fn();
      render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={MOCK_REVIEW}
          onProceedToInterview={handleProceed}
        />,
      );

      // Exactly 1 public overall score element in Step 2
      const scoreElements = screen.getAllByTestId('inbound-readiness-score');
      expect(scoreElements).toHaveLength(1);

      // Verify the score matches the deterministic calculateInboundReadiness or stabilized review score
      const expectedScore = calculateInboundReadiness(MOCK_REVIEW.scores);
      expect(within(scoreElements[0]).getByText(String(expectedScore))).toBeDefined();
      expect(within(scoreElements[0]).getByText('/ 100')).toBeDefined();
    });

    it('renders exactly 1 public overall score element even for high-scoring (90+) profiles', () => {
      const highReview = {
        ...MOCK_REVIEW,
        overallScore: 92,
        scores: strongProfileScores,
        inboundReadiness: { score: 92 },
      };
      render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={highReview}
          onProceedToInterview={vi.fn()}
        />,
      );

      // Must be exactly 1 public overall score element in Step 2 even when celebratory banner is visible
      const scoreElements = screen.getAllByTestId('inbound-readiness-score');
      expect(scoreElements).toHaveLength(1);
      expect(screen.getAllByText(/Perfil Aprovado para Triagem nos EUA/i).length).toBeGreaterThanOrEqual(1);
    });

    it('keeps the 5 technical pillars hidden until explicit disclosure (progressive disclosure)', () => {
      const handleProceed = vi.fn();
      render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={MOCK_REVIEW}
          onProceedToInterview={handleProceed}
          defaultExpanded={false}
        />,
      );

      const disclosure = screen.getByTestId('technical-diagnosis-disclosure') as HTMLDetailsElement;
      expect(disclosure).toBeDefined();
      expect(disclosure.open).toBe(false);

      // Summary is visible
      expect(screen.getByText('Por que essa nota?')).toBeDefined();

      // Technical pillars block is encapsulated inside the collapsed details element
      const pillars = screen.getByTestId('technical-pillars');
      expect(disclosure.contains(pillars)).toBe(true);

      // Explicitly opening reveals disclosure
      fireEvent.click(screen.getByText('Por que essa nota?'));
      expect(disclosure.open).toBe(true);
    });

    it('renders exactly 1 primary CTA in Step 2', () => {
      const handleProceed = vi.fn();
      render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={MOCK_REVIEW}
          onProceedToInterview={handleProceed}
        />,
      );

      const primaryCtas = screen.getAllByTestId('primary-cta');
      expect(primaryCtas).toHaveLength(1);

      const cta = primaryCtas[0];
      expect(cta.textContent).toContain('Continuar para a Entrevista Técnica →');

      fireEvent.click(cta);
      expect(handleProceed).toHaveBeenCalledTimes(1);
    });
  });

  describe('Invariant 4: Action Hub Navigation (Top Tabs & URL Sync)', () => {
    it('renders exactly 3 top tabs (My Profile, Search, Launch)', () => {
      render(
        <ActionHubView
          analysis={sampleAnalysis}
          originalProfile={MOCK_PROFILE}
          initialReview={MOCK_REVIEW}
          onStartNew={vi.fn()}
        />,
      );

      const tabsList = screen.getByTestId('action-hub-tabs-list');
      const tabs = within(tabsList).getAllByRole('tab');
      expect(tabs).toHaveLength(3);

      expect(tabs[0].textContent).toContain('My Profile');
      expect(tabs[1].textContent).toContain('Search');
      expect(tabs[2].textContent).toContain('Launch');
    });

    it('syncs top tabs with window location search (?tab=...) and switches tabs correctly', () => {
      window.history.pushState({}, '', '/?tab=search');

      render(
        <ActionHubView
          analysis={sampleAnalysis}
          originalProfile={MOCK_PROFILE}
          initialReview={MOCK_REVIEW}
          onStartNew={vi.fn()}
        />,
      );

      const searchTab = screen.getByRole('tab', { name: /search/i });
      expect(searchTab.getAttribute('data-state')).toBe('active');
      expect(searchTab.getAttribute('aria-selected')).toBe('true');

      // Click Launch tab
      const launchTab = screen.getByRole('tab', { name: /launch/i });
      fireEvent.click(launchTab);

      expect(launchTab.getAttribute('data-state')).toBe('active');
      expect(launchTab.getAttribute('aria-selected')).toBe('true');
      expect(window.location.search).toContain('tab=launch');
    });

    it('falls back to "profile" tab when URL search param contains an invalid tab (?tab=invalid_tab)', () => {
      window.history.pushState({}, '', '/?tab=invalid_tab');

      render(
        <ActionHubView
          analysis={sampleAnalysis}
          originalProfile={MOCK_PROFILE}
          initialReview={MOCK_REVIEW}
          onStartNew={vi.fn()}
        />,
      );

      const profileTab = screen.getByRole('tab', { name: /my profile/i });
      expect(profileTab.getAttribute('data-state')).toBe('active');
      expect(profileTab.getAttribute('aria-selected')).toBe('true');
    });

    it('executes the interaction loop: fixing a missing search term switches to profile tab and focuses target section', () => {
      clearTelemetry();
      window.history.pushState({}, '', '/?tab=search');

      render(
        <ActionHubView
          analysis={sampleAnalysis}
          originalProfile={MOCK_PROFILE}
          initialReview={MOCK_REVIEW}
          onStartNew={vi.fn()}
        />,
      );

      // Search simulator input
      const input = screen.getByPlaceholderText(/Ex: "Senior Backend Engineer"/i);
      fireEvent.change(input, { target: { value: 'Java AND GraphQL' } });

      // Click Corrigir no Perfil
      const fixBtn = screen.getByRole('button', { name: /Corrigir no Perfil →/i });
      fireEvent.click(fixBtn);

      // Tab switches to profile in URL and UI
      expect(window.location.search).toContain('tab=profile');
      const profileTab = screen.getByRole('tab', { name: /my profile/i });
      expect(profileTab.getAttribute('data-state')).toBe('active');

      // Telemetry records the interaction locally with zero network leak
      const events = getRecentEvents();
      expect(events.some((e) => e.event === 'fix_gap_clicked' && e.data?.gapType === 'skills')).toBe(true);
    });
  });

  describe('Invariant 5: Deterministic Formulas & Hysteresis with Core Fixtures', () => {
    it('calculates deterministic Inbound Readiness accurately across weak, boundary, and strong profiles', () => {
      // Weak Profile: 0.35(35) + 0.25(40) + 0.20(30) + 0.10(45) + 0.10(50) = 37.75 -> 38
      const weakScore = calculateInboundReadiness(weakProfileScores);
      expect(weakScore).toBe(38);
      const weakClassification = getInboundReadinessClassification(weakScore);
      expect(weakClassification.status).toBe('blocked');
      expect(weakClassification.label).toBe('Gargalos Críticos na Triagem');

      // Boundary Profile: 0.35(80) + 0.25(65) + 0.20(75) + 0.10(60) + 0.10(70) = 72.25 -> 72
      const boundaryScore = calculateInboundReadiness(boundaryProfileScores);
      expect(boundaryScore).toBe(72);
      const boundaryClassification = getInboundReadinessClassification(boundaryScore);
      expect(boundaryClassification.status).toBe('needs_attention');
      expect(boundaryClassification.label).toBe('Perfil Competitivo com Ajustes Pontuais');

      // Strong Profile: 0.35(95) + 0.25(90) + 0.20(88) + 0.10(92) + 0.10(90) = 91.55 -> 92
      const strongScore = calculateInboundReadiness(strongProfileScores);
      expect(strongScore).toBe(92);
      const strongClassification = getInboundReadinessClassification(strongScore);
      expect(strongClassification.status).toBe('ready');
      expect(strongClassification.label).toBe('Perfil Aprovado para Triagem nos EUA');
    });

    it('strictly respects hysteresis noise band (+-2 points) and monotonicity', () => {
      // Hysteresis noise band (minor drop within +-2 points is preserved)
      expect(stabilizeInboundReadiness({ previousScore: 70, rawScore: 69 })).toBe(70);
      expect(stabilizeInboundReadiness({ previousScore: 70, rawScore: 68 })).toBe(70);

      // Exceeding noise band updates
      expect(stabilizeInboundReadiness({ previousScore: 70, rawScore: 67 })).toBe(67);
      expect(stabilizeInboundReadiness({ previousScore: 70, rawScore: 73 })).toBe(73);

      // Monotonicity during generation (preserves previous score on refinement)
      expect(
        stabilizeInboundReadiness({ previousScore: 85, rawScore: 80, hasMaterialImprovement: true }),
      ).toBe(85);
      expect(
        stabilizeInboundReadiness({ previousScore: 85, rawScore: 80, hasMaterialImprovement: false }),
      ).toBe(80);
      expect(stabilizeInboundReadiness({ previousScore: 85, rawScore: 92 })).toBe(92);
    });

    it('projects Inbound Journey funnel deterministically with InMail not measurable', () => {
      const journey = calculateInboundJourney(strongProfileScores);

      expect(journey.search.id).toBe('search');
      expect(journey.search.score).toBe(
        Math.round(0.7 * strongProfileScores.searchRelevance + 0.3 * strongProfileScores.positioningClarity),
      );
      expect(journey.search.status).toBe('ready');

      expect(journey.card.id).toBe('card');
      expect(journey.card.status).toBe('ready');

      expect(journey.profile.id).toBe('profile');
      expect(journey.profile.status).toBe('ready');

      expect(journey.inmail.id).toBe('inmail');
      expect(journey.inmail.status).toBe('not_measurable');
      expect(journey.inmail.score).toBeUndefined();
      expect(journey.inmail.description).toBe('Conversão em mensagens diretas de tech recruiters');
    });

    it('exports rawInboundReadiness alias matching calculateInboundReadiness', () => {
      expect(rawInboundReadiness).toBe(calculateInboundReadiness);
      expect(rawInboundReadiness(strongProfileScores)).toBe(92);
    });

    it('validates InboundJourney structure with runtime Zod schema inboundJourneySchema', () => {
      const journey = calculateInboundJourney(strongProfileScores);
      const parsed = inboundJourneySchema.parse(journey);
      expect(parsed.search.status).toBe('ready');
      expect(parsed.card.status).toBe('ready');
      expect(parsed.profile.status).toBe('ready');
      expect(parsed.inmail.status).toBe('not_measurable');
    });

    it('supports candidateId persistence and unchanged evidenceHash monotonicity in stabilizeInboundReadiness', () => {
      // First call for candidate 'cand-1' sets baseline
      expect(
        stabilizeInboundReadiness({ candidateId: 'cand-1', evidenceHash: 'hash-abc', rawScore: 88 }),
      ).toBe(88);

      // Second call with same evidenceHash prevents jitter regression even without previousScore passed
      expect(
        stabilizeInboundReadiness({ candidateId: 'cand-1', evidenceHash: 'hash-abc', rawScore: 84 }),
      ).toBe(88);

      // Different candidate is isolated
      expect(
        stabilizeInboundReadiness({ candidateId: 'cand-2', rawScore: 65 }),
      ).toBe(65);
    });
  });
});
