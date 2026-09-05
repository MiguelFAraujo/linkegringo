import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
