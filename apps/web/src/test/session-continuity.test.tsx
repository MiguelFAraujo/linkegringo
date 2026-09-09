import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { App } from '../App';
import { DiagnosticView } from '../components/DiagnosticView';
import {
  getStoredChatHistory,
  setStoredChatHistory,
  clearStoredChatHistory,
  getStoredSession,
  saveStoredSession,
  clearStoredSession,
} from '../lib/storage';
import { MOCK_PROFILE, MOCK_REVIEW } from '@linkegringo/ai';

// Mock confetti & clipboard
vi.mock('@/lib/file-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/file-utils')>();
  return {
    ...actual,
    fireConfetti: vi.fn(),
    copyToClipboard: vi.fn().mockResolvedValue(true),
  };
});

describe('Session Continuity and UI Verification', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('linkegringo_provider_id', 'demo');
    localStorage.setItem('linkegringo_onboarding_seen', 'true');
  });

  describe('Storage Primitive Resilience', () => {
    it('handles corrupted JSON in CHAT_HISTORY gracefully without throwing', () => {
      localStorage.setItem('linkegringo_chat_history', '{ invalid json [');
      expect(getStoredChatHistory()).toBeNull();
    });

    it('returns null if CHAT_HISTORY is a non-array JSON value (e.g. object, number, string)', () => {
      localStorage.setItem('linkegringo_chat_history', JSON.stringify({ not: 'an array' }));
      expect(getStoredChatHistory()).toBeNull();

      localStorage.setItem('linkegringo_chat_history', JSON.stringify(42));
      expect(getStoredChatHistory()).toBeNull();

      localStorage.setItem('linkegringo_chat_history', JSON.stringify('string'));
      expect(getStoredChatHistory()).toBeNull();
    });

    it('persists and restores valid chat history structures', () => {
      const turns = [
        { role: 'user', parts: [{ text: 'User prompt' }] },
        { role: 'model', parts: [{ text: 'AI response' }] },
      ];
      setStoredChatHistory(turns);
      expect(getStoredChatHistory()).toEqual(turns);

      clearStoredChatHistory();
      expect(getStoredChatHistory()).toBeNull();
    });

    it('clearStoredSession removes both SESSION and CHAT_HISTORY', () => {
      saveStoredSession({ step: 'diagnostic', profile: MOCK_PROFILE, review: MOCK_REVIEW });
      setStoredChatHistory([{ role: 'user', parts: [{ text: 'turn' }] }]);

      expect(getStoredSession()).not.toBeNull();
      expect(getStoredChatHistory()).not.toBeNull();

      clearStoredSession();

      expect(getStoredSession()).toBeNull();
      expect(getStoredChatHistory()).toBeNull();
    });
  });

  describe('F5 Reload and Provider Instance Lifecycle in App', () => {
    it('restores profile, review, and safe step on reload from stored session', async () => {
      saveStoredSession({
        step: 'diagnostic',
        profile: MOCK_PROFILE,
        review: MOCK_REVIEW,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
        expect(screen.getByText('Alexandre Rocha')).toBeDefined();
      });
    });

    it('falls back safely if step is interview/facts/action-hub without requisite data on reload', async () => {
      // Missing analysis when step is action-hub
      saveStoredSession({
        step: 'action-hub',
        profile: MOCK_PROFILE,
        review: MOCK_REVIEW,
      });

      render(<App />);

      await waitFor(() => {
        // Should fall back to diagnostic because analysis is missing and facts is empty
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
      });
    });

    it('persists chatHistory to localStorage and session storage after parseAndDiagnose', async () => {
      render(<App />);

      const demoButtons = screen.getAllByText(/Testar com Perfil de Demonstração/i);
      fireEvent.click(demoButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
      });

      const savedSession = getStoredSession<any>();
      const savedChatHistory = getStoredChatHistory();

      expect(savedSession).not.toBeNull();
      expect(Array.isArray(savedChatHistory)).toBe(true);
      expect(savedChatHistory!.length).toBeGreaterThan(0);
      expect(Array.isArray(savedSession?.chatHistory)).toBe(true);
      expect(savedSession?.chatHistory?.length).toBeGreaterThan(0);
      expect(savedSession?.chatHistory).toEqual(savedChatHistory);
    });

    it('rehydrates chat history and preserves provider session continuity across F5 reload', async () => {
      const initialTurns = [
        { role: 'user', parts: [{ text: 'Initial CV parse' }] },
        { role: 'model', parts: [{ text: 'Diagnostic analysis generated' }] },
      ];

      saveStoredSession({
        step: 'diagnostic',
        profile: MOCK_PROFILE,
        review: MOCK_REVIEW,
        chatHistory: initialTurns,
      });
      setStoredChatHistory(initialTurns);

      const { unmount } = render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
      });

      expect(getStoredChatHistory()).toEqual(initialTurns);
      const rehydratedSession = getStoredSession<any>();
      expect(rehydratedSession?.chatHistory).toEqual(initialTurns);

      // Simulate F5 page reload: unmount and remount App
      unmount();

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
      });

      expect(getStoredChatHistory()).toEqual(initialTurns);
      const reloadedSession = getStoredSession<any>();
      expect(reloadedSession?.chatHistory).toEqual(initialTurns);
    });

    it('maintains provider instance and preserves chat history across multi-turn transitions', async () => {
      render(<App />);

      // Turn 1: Click demo profile button to trigger parseAndDiagnose
      const demoButtons = screen.getAllByText(/Testar com Perfil de Demonstração/i);
      fireEvent.click(demoButtons[0]);

      await waitFor(() => {
        expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
      });

      const historyAfterTurn1 = getStoredChatHistory();
      expect(historyAfterTurn1).not.toBeNull();
      expect(historyAfterTurn1!.length).toBeGreaterThanOrEqual(2);

      // Turn 2: Click button to proceed to interview
      const proceedButton = screen.getAllByText(/Otimizar Perfil|Avançar para a entrevista/i)[0];
      fireEvent.click(proceedButton);

      await waitFor(() => {
        expect(screen.getByText(/Entrevista técnica/i)).toBeDefined();
      });

      const historyAfterTurn2 = getStoredChatHistory();
      expect(historyAfterTurn2).not.toBeNull();
      expect(historyAfterTurn2!.length).toBeGreaterThanOrEqual(2);
      const savedSession = getStoredSession<any>();
      expect(savedSession?.chatHistory).toEqual(historyAfterTurn2);
    });
  });

  describe('DiagnosticView triageBottlenecks Card & Empty States', () => {
    it('renders triageBottlenecks card with proper warning classes, counter badge, and explanation', () => {
      const reviewWithBottlenecks = {
        ...MOCK_REVIEW,
        triageBottlenecks: [
          'Perfil em português inviabiliza triagem nos EUA.',
          'Ausência de métricas de escala no framework XYZ.',
          'Cargo atual genérico sem especialização clara.',
        ],
      };

      const { container } = render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={reviewWithBottlenecks}
          onProceedToInterview={vi.fn()}
        />,
      );

      // Warning styling
      const bottleneckCard = container.querySelector('.bg-rose-950\\/20');
      expect(bottleneckCard).not.toBeNull();
      expect(bottleneckCard?.classList.contains('border-rose-500/30')).toBe(true);

      // Header title
      expect(screen.getByText(/Gargalos de Triagem \(Filtro Recrutadores EUA\)/i)).toBeDefined();

      // Recruiter context description
      expect(screen.getByText(/Pontos que causam descarte imediato na triagem de 6 segundos/i)).toBeDefined();

      // Badge count
      expect(screen.getByText('3')).toBeDefined();

      // All 3 items rendered
      expect(screen.getByText('Perfil em português inviabiliza triagem nos EUA.')).toBeDefined();
      expect(screen.getByText('Ausência de métricas de escala no framework XYZ.')).toBeDefined();
      expect(screen.getByText('Cargo atual genérico sem especialização clara.')).toBeDefined();
    });

    it('does NOT render card when triageBottlenecks is an empty array', () => {
      const reviewEmpty = {
        ...MOCK_REVIEW,
        triageBottlenecks: [],
      };

      const { container } = render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={reviewEmpty}
          onProceedToInterview={vi.fn()}
        />,
      );

      expect(screen.queryByText(/Gargalos de Triagem/i)).toBeNull();
      expect(container.querySelector('.bg-rose-950\\/20')).toBeNull();
    });

    it('does NOT crash and does NOT render card when triageBottlenecks is undefined or null', () => {
      const reviewUndefined = {
        ...MOCK_REVIEW,
        triageBottlenecks: undefined as any,
      };

      const { rerender, container } = render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={reviewUndefined}
          onProceedToInterview={vi.fn()}
        />,
      );

      expect(screen.queryByText(/Gargalos de Triagem/i)).toBeNull();

      // Null case
      const reviewNull = {
        ...MOCK_REVIEW,
        triageBottlenecks: null as any,
      };

      rerender(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={reviewNull}
          onProceedToInterview={vi.fn()}
        />,
      );

      expect(screen.queryByText(/Gargalos de Triagem/i)).toBeNull();
      expect(container.querySelector('.bg-rose-950\\/20')).toBeNull();
    });

    it('handles single bottleneck and large bottleneck lists safely', () => {
      const singleReview = {
        ...MOCK_REVIEW,
        triageBottlenecks: ['Apenas um gargalo crítico.'],
      };

      const { rerender } = render(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={singleReview}
          onProceedToInterview={vi.fn()}
        />,
      );

      expect(screen.getByText('1')).toBeDefined();
      expect(screen.getByText('Apenas um gargalo crítico.')).toBeDefined();

      const largeList = Array.from({ length: 8 }, (_, i) => `Gargalo crítico número ${i + 1}`);
      const multiReview = {
        ...MOCK_REVIEW,
        triageBottlenecks: largeList,
      };

      rerender(
        <DiagnosticView
          profile={MOCK_PROFILE}
          review={multiReview}
          onProceedToInterview={vi.fn()}
        />,
      );

      expect(screen.getByText('8')).toBeDefined();
      expect(screen.getByText('Gargalo crítico número 8')).toBeDefined();
    });
  });
});


