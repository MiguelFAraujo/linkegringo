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

  it('runs demo mode through diagnostic, objective, and allows skipping interview to facts with populated baseline facts', async () => {
    render(<App />);

    // Click demo mode button
    const demoButtons = screen.getAllByText(/Testar com Perfil de Demonstração/i);
    fireEvent.click(demoButtons[0]);

    // Should arrive at Diagnostic view
    await waitFor(() => {
      expect(screen.getByText(/Raio-X Inicial do LinkedIn/i)).toBeDefined();
    });

    // Advance to Objective
    const proceedBtn = screen.getByText(/Otimizar Perfil/i);
    fireEvent.click(proceedBtn);

    await waitFor(() => {
      expect(screen.getByText(/Defina seu Cargo-Alvo para os EUA/i)).toBeDefined();
    });

    // Advance to Interview
    const startInterviewBtn = screen.getByText(/Iniciar Entrevista com Dicas de Coaching/i);
    fireEvent.click(startInterviewBtn);

    await waitFor(() => {
      expect(screen.getByText(/Entrevista de Coaching Técnico • Rodada 1/i)).toBeDefined();
    });

    // Skip interview early via "Finalizar entrevista antecipadamente"
    const skipEarlyBtn = screen.getByText(/Finalizar entrevista antecipadamente/i);
    fireEvent.click(skipEarlyBtn);

    // Should transition to Facts Confirmation with baseline facts extracted from profile
    await waitFor(() => {
      expect(screen.getByText(/Passo 4: Garantia Anti-Alucinação/i)).toBeDefined();
      expect(screen.getByText(/Confirme os Fatos Técnicos do seu Perfil/i)).toBeDefined();
    });

    // Verify facts were populated from candidate profile (not 0)
    const generateBtn = screen.getByText(/Gerar Perfil Otimizado/i).closest('button');
    expect(generateBtn?.hasAttribute('disabled')).toBe(false);
    expect(screen.getAllByText(/Atuou como/i).length).toBeGreaterThanOrEqual(1);
  });
});

