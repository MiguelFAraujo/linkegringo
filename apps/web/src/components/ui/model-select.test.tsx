import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ModelSelect, type ModelOption, formatTokenLimit, formatTokensSummary } from './model-select';

const mockModels: ModelOption[] = [
  {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    description: 'Ultra rápido e estável',
    badge: 'Recomendado',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    id: 'gemini-3.6-flash',
    displayName: 'Gemini 3.6 Flash',
    description: 'Versão atualizada recomendada',
    badge: 'Mais Recente',
    inputTokenLimit: 1048576,
    outputTokenLimit: 8192,
  },
  {
    id: 'gemini-3.7-flash',
    displayName: 'Gemini 3.7 Flash',
    description: 'Alta Performance',
    badge: 'Alta Performance',
    inputTokenLimit: 1048576,
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
        value="gemini-3.5-flash"
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
        value="gemini-3.5-flash"
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
        value="gemini-3.5-flash"
        onChange={vi.fn()}
        models={mockModels}
      />,
    );

    expect(screen.getByText('Gemini 3.5 Flash')).toBeDefined();
    expect(screen.getByText('(gemini-3.5-flash)')).toBeDefined();
    expect(screen.getByText('Recomendado')).toBeDefined();
  });

  it('opens dropdown, searches and selects an option', () => {
    const handleChange = vi.fn();
    render(
      <ModelSelect
        value="gemini-3.5-flash"
        onChange={handleChange}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    // Listbox should now be visible
    expect(screen.getByRole('listbox')).toBeDefined();
    expect(screen.getByText('Gemini 3.6 Flash')).toBeDefined();
    expect(screen.getByText('Gemini 3.7 Flash')).toBeDefined();

    // Type in search
    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou id/i);
    fireEvent.change(searchInput, { target: { value: '3.6' } });

    // Only 3.6 should match
    expect(screen.getByText('Gemini 3.6 Flash')).toBeDefined();
    expect(screen.queryByText('Gemini 3.7 Flash')).toBeNull();

    // Click the option
    const option = screen.getByRole('option', { name: /Gemini 3.6 Flash/i });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('gemini-3.6-flash');
    // Dropdown should close
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('shows empty state message when search query does not match any model', () => {
    render(
      <ModelSelect
        value="gemini-3.5-flash"
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
        value="gemini-3.5-flash"
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
        value="gemini-3.5-flash"
        onChange={handleChange}
        models={mockModels}
      />,
    );

    const trigger = screen.getByRole('button');
    fireEvent.click(trigger);

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou id/i);
    // Move down to index 1 (gemini-3.6-flash)
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    // Press Enter to select
    fireEvent.keyDown(searchInput, { key: 'Enter' });

    expect(handleChange).toHaveBeenCalledWith('gemini-3.6-flash');
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
