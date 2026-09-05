import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { App } from './App';

// Mock confetti
vi.mock('@/lib/file-utils', () => ({
  fireConfetti: vi.fn(),
  copyToClipboard: vi.fn().mockResolvedValue(true),
  hasSeenOnboarding: () => true,
  setOnboardingSeen: vi.fn(),
  getStoredApiKey: () => '',
  getStoredProviderId: () => 'demo',
  getStoredSession: () => null,
  saveStoredSession: vi.fn(),
  clearStoredSession: vi.fn(),
}));

describe('App Component', () => {
  it('renders the brand LinkeGringo and initial upload view', () => {
    render(<App />);
    const linkeElements = screen.getAllByText(/Linke/i);
    expect(linkeElements.length).toBeGreaterThanOrEqual(1);

    const gringoElements = screen.getAllByText(/Gringo/i);
    expect(gringoElements.length).toBeGreaterThanOrEqual(1);

    expect(screen.getByText(/Destrave seu Perfil do LinkedIn/i)).toBeDefined();
  });

  it('runs demo mode through diagnostic, directly to interview, and allows skipping interview to facts with populated baseline facts', async () => {
    render(<App />);

    // Click demo mode button
    const demoButtons = screen.getAllByText(/Testar com Perfil de Demonstração/i);
    fireEvent.click(demoButtons[0]);

    // Should arrive at Diagnostic view
    await waitFor(() => {
      expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
    });

    // Advance to Interview directly (ObjectiveForm was eliminated)
    const proceedBtn = screen.getByText(/Avançar para a entrevista/i);
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText(/Entrevista técnica — pergunta/i)).toBeDefined();
    });

    // Skip interview early via "Finalizar entrevista antecipadamente"
    const skipEarlyBtn = screen.getByText(/Finalizar entrevista antecipadamente/i);
    fireEvent.click(skipEarlyBtn);

    // Should transition to Facts Confirmation with baseline facts extracted from profile
    await waitFor(() => {
      expect(screen.getByText(/Confirmação de dados extraídos/i)).toBeDefined();
    });

    // Verify facts were populated from candidate profile (not 0)
    const generateBtn = screen.getByText(/Gerar perfil em inglês/i).closest('button');
    expect(generateBtn?.hasAttribute('disabled')).toBe(false);
    expect(screen.getAllByText(/Atuou como/i).length).toBeGreaterThanOrEqual(1);
  });
});

