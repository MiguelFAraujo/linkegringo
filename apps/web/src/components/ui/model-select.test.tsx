import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ModelSelect, type ModelOption, formatTokenLimit, formatTokensSummary } from './model-select';

const mockModels: ModelOption[] = [
  {
    id: 'gemini-2.0-flash',
    displayName: 'Gemini 2.0 Flash',
    description: 'Ultra rápido e estável',
    badge: 'Recomendado',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    id: 'gemini-2.5-flash',
    displayName: 'Gemini 2.5 Flash',
    description: 'Raciocínio experimental',
    badge: 'Experimental',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    id: 'gemini-1.5-pro',
    displayName: 'Gemini 1.5 Pro',
    description: 'Contexto amplo de 2M tokens',
    badge: 'Estável',
    inputTokenLimit: 2097152,
    outputTokenLimit: 8192,
  },
];

describe('formatTokenLimit helper', () => {
  it('formats millions and thousands correctly', () => {
    expect(formatTokenLimit(1048576)).toBe('1M');
    expect(formatTokenLimit(2097152)).toBe('2.1M');
    expect(formatTokenLimit(8192)).toBe('8k');
    expect(formatTokenLimit(500)).toBe('500');
    expect(formatTokenLimit(undefined)).toBeNull();
  });

  it('formats summary with input and output', () => {
    expect(formatTokensSummary(1048576, 8192)).toBe('1M in • 8k out');
    expect(formatTokensSummary(1048576, undefined)).toBe('1M tokens');
    expect(formatTokensSummary(undefined, 8192)).toBe('8k out');
    expect(formatTokensSummary(undefined, undefined)).toBeNull();
  });
});

describe('ModelSelect Component', () => {
  it('renders disabled state with message when disabled is true', () => {
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={vi.fn()}
        models={mockModels}
        disabled={true}
      />,
    );

    const button = screen.getByRole('button');
    expect(button).toBeDefined();
    expect(button.getAttribute('disabled')).not.toBeNull();
    expect(screen.getByText('Insira uma chave válida para carregar os modelos')).toBeDefined();
  });

  it('renders loading state when isLoading is true', () => {
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={vi.fn()}
        models={mockModels}
        isLoading={true}
      />,
    );

    const button = screen.getByRole('button');
    expect(button.getAttribute('disabled')).not.toBeNull();
    expect(screen.getByText('Carregando modelos disponíveis...')).toBeDefined();
  });

  it('renders selected model with displayName, id and badge when enabled', () => {
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={vi.fn()}
        models={mockModels}
      />,
    );

    expect(screen.getByText('Gemini 2.0 Flash')).toBeDefined();
    expect(screen.getByText('(gemini-2.0-flash)')).toBeDefined();
    expect(screen.getByText('Recomendado')).toBeDefined();
  });

  it('opens dropdown, searches and selects an option', () => {
    const handleChange = vi.fn();
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={handleChange}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    // Listbox should now be visible
    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getByText('Gemini 2.5 Flash')).toBeDefined();
    expect(screen.getByText('Gemini 1.5 Pro')).toBeDefined();

    // Type in search
    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou id/i);
    fireEvent.change(searchInput, { target: { value: '2.5' } });

    // Only 2.5 should match
    expect(screen.getByText('Gemini 2.5 Flash')).toBeDefined();
    expect(screen.queryByText('Gemini 1.5 Pro')).toBeNull();

    // Click the option
    const option = screen.getByRole('option', { name: /Gemini 2.5 Flash/i });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('gemini-2.5-flash');
    // Dropdown should close
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows empty state message when search query does not match any model', () => {
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={vi.fn()}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou id/i);
    fireEvent.change(searchInput, { target: { value: 'non-existent-query-xyz' } });

    expect(screen.getByText(/Nenhum modelo encontrado para "non-existent-query-xyz"/i)).toBeDefined();
  });

  it('closes dropdown and stops propagation when Escape is pressed', () => {
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={vi.fn()}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);
    expect(screen.getByRole('listbox')).toBeDefined();

    const notPrevented = fireEvent.keyDown(window, { key: 'Escape' });
    expect(notPrevented).toBe(false);
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('supports keyboard navigation with ArrowDown, ArrowUp and Enter to select', () => {
    const handleChange = vi.fn();
    render(
      <ModelSelect
        value="gemini-2.0-flash"
        onChange={handleChange}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou id/i);
    // Move down to index 1 (gemini-2.5-flash)
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('gemini-2.5-flash');
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('displays "Nenhum modelo disponível." when models array is empty and opened', () => {
    render(
      <ModelSelect
        value=""
        onChange={vi.fn()}
        models={[]}
        disabled={false}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    expect(screen.getByText('Nenhum modelo disponível.')).toBeDefined();
  });
});
