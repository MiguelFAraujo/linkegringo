import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import { ApiKeyDialog } from './ApiKeyDialog';
import * as storage from '../lib/storage';
import * as ai from '@linkegringo/ai';

describe('ApiKeyDialog Component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders dialog and shows disabled ModelSelect when no key is entered', () => {
    render(
      <ApiKeyDialog
        open={true}
        onOpenChange={vi.fn()}
        apiKey=""
        providerId="gemini"
        model="gemini-2.0-flash"
        onSave={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText(/Configuração de Provedor & Chave de IA/i)).toBeDefined();
    expect(screen.getByText(/Modelo do Google Gemini/i)).toBeDefined();
    expect(screen.getByText('Insira uma chave válida para carregar os modelos')).toBeDefined();
  });

  it('loads models from cache if available on open', () => {
    vi.spyOn(storage, 'getCachedGeminiModels').mockReturnValue({
      apiKeyHash: 'hash-123',
      models: [
        {
          id: 'gemini-2.0-flash',
          displayName: 'Gemini 2.0 Flash Dynamic',
          description: 'Cache hit',
          supportedGenerationMethods: ['generateContent'],
          badge: 'Recomendado',
        },
      ],
    });

    render(
      <ApiKeyDialog
        open={true}
        onOpenChange={vi.fn()}
        apiKey="valid-test-key-cached"
        providerId="gemini"
        model="gemini-2.0-flash"
        onSave={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(screen.getByText('Gemini 2.0 Flash Dynamic')).toBeDefined();
  });

  it('invokes fetchGeminiModels when clicking reload models button', async () => {
    const fetchSpy = vi.spyOn(ai, 'fetchGeminiModels').mockResolvedValue([
      {
        id: 'gemini-2.5-flash',
        displayName: 'Gemini 2.5 Flash Fresh',
        description: 'Freshly fetched',
        supportedGenerationMethods: ['generateContent'],
        badge: 'Experimental',
      },
    ]);

    render(
      <ApiKeyDialog
        open={true}
        onOpenChange={vi.fn()}
        apiKey="test-api-key-12345678"
        providerId="gemini"
        model="gemini-2.5-flash"
        onSave={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    // Initial auto-fetch on mount
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('test-api-key-12345678');
      expect(screen.getByText('Gemini 2.5 Flash Fresh')).toBeDefined();
    });

    // Now test manual reload with new response
    fetchSpy.mockClear();
    fetchSpy.mockResolvedValueOnce([
      {
        id: 'gemini-2.0-flash',
        displayName: 'Gemini 2.0 Flash Reloaded',
        description: 'Reloaded model',
        supportedGenerationMethods: ['generateContent'],
        badge: 'Recomendado',
      },
    ]);

    const reloadBtn = screen.getByRole('button', { name: /Recarregar Modelos/i });
    fireEvent.click(reloadBtn);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('test-api-key-12345678');
      expect(screen.getByText('Gemini 2.0 Flash Reloaded')).toBeDefined();
    });
  });

  it('calls onSave with updated key, provider and model when saved', () => {
    const onSave = vi.fn();
    const onOpenChange = vi.fn();

    render(
      <ApiKeyDialog
        open={true}
        onOpenChange={onOpenChange}
        apiKey="my-saved-key"
        providerId="gemini"
        model="gemini-2.0-flash"
        onSave={onSave}
        onClear={vi.fn()}
      />,
    );

    const saveBtn = screen.getByRole('button', { name: /Salvar Configuração/i });
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith('my-saved-key', 'gemini', 'gemini-2.0-flash');
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('calls onClear and clears key when clicking Remover Chave', () => {
    const onClear = vi.fn();

    render(
      <ApiKeyDialog
        open={true}
        onOpenChange={vi.fn()}
        apiKey="key-to-remove"
        providerId="gemini"
        model="gemini-2.0-flash"
        onSave={vi.fn()}
        onClear={onClear}
      />,
    );

    const removeBtn = screen.getByRole('button', { name: /Remover Chave/i });
    fireEvent.click(removeBtn);

    expect(onClear).toHaveBeenCalled();
  });
});
