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

    expect(screen.getByLabelText(/What should recruiters find you for\?/i)).toBeDefined();
    const input = screen.getByRole('textbox', { name: /What should recruiters find you for\?/i }) as HTMLInputElement;
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

    const input = screen.getByRole('textbox', { name: /What should recruiters find you for\?/i }) as HTMLInputElement;
    expect(input.value).toBe('Staff Engineer');
  });

  it('invokes onLoadDemo with chosen target role when demo button is clicked', () => {
    const handleLoadDemo = vi.fn();
    render(<FileUploadDropzone {...defaultProps} onLoadDemo={handleLoadDemo} />);

    const fullStackChip = screen.getByRole('button', { name: 'Senior Full Stack Engineer' });
    fireEvent.click(fullStackChip);

    const demoBtn = screen.getAllByText(/Testar com Perfil de Demonstração/i)[0];
    fireEvent.click(demoBtn);

    expect(handleLoadDemo).toHaveBeenCalledWith('Senior Full Stack Engineer');
  });

  it('disables primary CTA until a valid PDF file is selected', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    const analyzeBtn = screen.getByText(/Descobrir minha visibilidade/i).closest('button');
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

    const analyzeBtn = screen.getByText(/Descobrir minha visibilidade/i).closest('button') as HTMLButtonElement;
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

  it('renders the 3-step tutorial explaining how to export the PDF from LinkedIn and allows collapsing it', () => {
    localStorage.clear();
    render(<FileUploadDropzone {...defaultProps} />);

    // Initially open
    expect(screen.getByText(/Como exportar o PDF correto do LinkedIn\?/i)).toBeDefined();
    expect(screen.getByText(/1\. Perfil/i)).toBeDefined();
    expect(screen.getByText(/2\. Botão "Mais"/i)).toBeDefined();
    expect(screen.getByText(/3\. Salvar como PDF/i)).toBeDefined();

    // Collapse tutorial
    const toggleBtn = screen.getByRole('button', { name: /Como exportar o PDF correto do LinkedIn\?/i });
    fireEvent.click(toggleBtn);

    // Steps should be hidden
    expect(screen.queryByText(/1\. Perfil/i)).toBeNull();

    // Reopen tutorial
    fireEvent.click(toggleBtn);
    expect(screen.getByText(/1\. Perfil/i)).toBeDefined();
  });

  it('renders the new Recruiter Visibility Optimizer headline, example report preview, trust bar, and 4-step logic footer', () => {
    render(<FileUploadDropzone {...defaultProps} />);

    // New headline & subheadline
    expect(screen.getByText('Pare de aplicar. Comece a ser encontrado.')).toBeDefined();
    expect(screen.getByText(/Descubra como recrutadores internacionais encontram seu perfil/i)).toBeDefined();

    // Example visual report preview with dominant score and Recruiter Card
    expect(screen.getByText('Exemplo')).toBeDefined();
    expect(screen.getByText('Recruiter Visibility')).toBeDefined();
    expect(screen.getByText('74')).toBeDefined();
    expect(screen.getByText('Headline positioning')).toBeDefined();
    expect(screen.getAllByText('Recruiter Card').length).toBeGreaterThanOrEqual(1);

    // Recruiter search simulation copy
    expect(screen.getByText('Simulação de busca de recruiter')).toBeDefined();

    // Trust bar
    expect(screen.getByText(/100% Client-Side · BYOK · Sem armazenamento pelo LinkeGringo/i)).toBeDefined();

    // 4-step footer
    expect(screen.getByText('01 BUSCA')).toBeDefined();
    expect(screen.getByText('02 RECRUITER CARD')).toBeDefined();
    expect(screen.getByText('03 PERFIL')).toBeDefined();
    expect(screen.getByText('04 INMAIL')).toBeDefined();
  });
});
