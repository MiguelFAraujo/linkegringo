import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { App } from './App';

// Mock confetti
vi.mock('@/lib/file-utils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/file-utils')>();
  return {
    ...actual,
    fireConfetti: vi.fn(),
    copyToClipboard: vi.fn().mockResolvedValue(true),
  };
});

describe('App Component', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('linkegringo_provider_id', 'demo');
    localStorage.setItem('linkegringo_onboarding_seen', 'true');
  });
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

  it('orchestrates LinkedIn PDF file submission with text extraction, parseProfile, and diagnoseProfile', async () => {
    render(<App />);

    const minimalPdf = `%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj
4 0 obj << /Length 44 >> stream
BT /F1 12 Tf 100 700 Td (Alexandre Rocha) Tj ET
endstream
endobj
5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000337 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
423
%%EOF`;

    const file = new File([new TextEncoder().encode(minimalPdf)], 'candidato-profile.pdf', {
      type: 'application/pdf',
    });

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText('candidato-profile.pdf')).toBeDefined();
    });

    const analyzeBtn = screen.getByText('Analisar Perfil').closest('button') as HTMLButtonElement;
    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(screen.getByText(/Diagnóstico do Perfil/i)).toBeDefined();
    }, { timeout: 4000 });
  });
});

