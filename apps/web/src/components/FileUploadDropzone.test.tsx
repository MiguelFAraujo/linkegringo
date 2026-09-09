import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { FileUploadDropzone, QUICK_TARGET_ROLES } from './FileUploadDropzone';

describe('FileUploadDropzone Component', () => {
  const defaultProps = {
    onAnalyze: vi.fn(),
    onLoadDemo: vi.fn(),
    isLoading: false,
    onOpenApiKeyDialog: vi.fn(),
    hasApiKey: true,
    isDemoMode: false,
  };

  it('renders target role selector and quick chips', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    expect(screen.getByLabelText(/Cargo Alvo nos EUA/i)).toBeDefined();
    const input = screen.getByRole('textbox', { name: /Cargo Alvo nos EUA/i }) as HTMLInputElement;
    expect(input.value).toBe('Senior Backend Engineer');

    // All quick suggestions should be rendered
    for (const role of QUICK_TARGET_ROLES) {
      expect(screen.getByRole('button', { name: role })).toBeDefined();
    }
  });

  it('updates target role when clicking a quick chip', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    const staffChip = screen.getByRole('button', { name: 'Staff Engineer' });
    fireEvent.click(staffChip);

    const input = screen.getByRole('textbox', { name: /Cargo Alvo nos EUA/i }) as HTMLInputElement;
    expect(input.value).toBe('Staff Engineer');
  });

  it('invokes onLoadDemo with chosen target role when demo button is clicked', () => {
    const handleLoadDemo = vi.fn();
    render(<FileUploadDropzone {...defaultProps} onLoadDemo={handleLoadDemo} />);

    const fullStackChip = screen.getByRole('button', { name: 'Senior Full Stack Engineer' });
    fireEvent.click(fullStackChip);

    const demoBtn = screen.getByText(/Testar com Perfil de Demonstração/i);
    fireEvent.click(demoBtn);

    expect(handleLoadDemo).toHaveBeenCalledWith('Senior Full Stack Engineer');
  });

  it('disables primary CTA until a valid PDF file is selected', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    const analyzeBtn = screen.getByText('Analisar Perfil').closest('button');
    expect(analyzeBtn?.hasAttribute('disabled')).toBe(true);
  });

  it('does NOT contain any CV or additional resume upload fields', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    // Ensure no mentions of additional CV or resume
    expect(screen.queryByText(/currículo/i)).toBeNull();
    expect(screen.queryByText(/cv/i)).toBeNull();
  });

  it('handles LinkedIn PDF selection and triggers onAnalyze with clean payload', async () => {
    const handleAnalyze = vi.fn().mockResolvedValue(undefined);
    render(<FileUploadDropzone {...defaultProps} onAnalyze={handleAnalyze} />);

    const fakePdf = new File(['%PDF-test'], 'perfil_linkedin.pdf', { type: 'application/pdf' });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeDefined();

    fireEvent.change(input, { target: { files: [fakePdf] } });

    // File name should be displayed
    expect(screen.getByText('perfil_linkedin.pdf')).toBeDefined();

    const analyzeBtn = screen.getByText('Analisar Perfil').closest('button') as HTMLButtonElement;
    expect(analyzeBtn.hasAttribute('disabled')).toBe(false);

    fireEvent.click(analyzeBtn);

    await waitFor(() => {
      expect(handleAnalyze).toHaveBeenCalledWith({
        file: fakePdf,
        fileName: 'perfil_linkedin.pdf',
        pdfBase64: expect.any(String),
        targetRole: 'Senior Backend Engineer',
      });
    });
  });

  it('displays custom loadingMessage when loading', () => {
    render(
      <FileUploadDropzone
        {...defaultProps}
        isLoading={true}
        loadingMessage="Extraindo perfil do LinkedIn..."
      />,
    );

    expect(screen.getByText('Extraindo perfil do LinkedIn...')).toBeDefined();
  });

  it('renders the 3-step tutorial explaining how to export the PDF from LinkedIn', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    expect(screen.getByText(/Como exportar o PDF correto do LinkedIn\?/i)).toBeDefined();
    expect(screen.getByText(/1\. Perfil/i)).toBeDefined();
    expect(screen.getByText(/2\. Botão "Mais"/i)).toBeDefined();
    expect(screen.getByText(/3\. Salvar como PDF/i)).toBeDefined();
  });
});
