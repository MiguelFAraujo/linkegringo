import { describe, expect, it } from 'vitest';
import { createAiProvider, getAvailableProviders } from './registry.js';
import { cleanBase64, extractJsonFromResponse } from './providers/gemini.js';

describe('AI Registry', () => {
  it('returns available providers with gemini and demo', () => {
    const providers = getAvailableProviders();
    expect(providers.length).toBeGreaterThanOrEqual(2);
    expect(providers.some((p) => p.id === 'gemini')).toBe(true);
    expect(providers.some((p) => p.id === 'demo')).toBe(true);
  });

  it('instantiates DemoAiProvider without apiKey', async () => {
    const provider = createAiProvider('demo');
    expect(provider.id).toBe('demo');
    const ok = await provider.testConnection();
    expect(ok).toBe(true);
  });

  it('throws error when instantiating GeminiAiProvider without apiKey', () => {
    expect(() => createAiProvider('gemini', { apiKey: '' })).toThrow(
      'Chave de API do Gemini não informada.',
    );
  });

  it('instantiates GeminiAiProvider with apiKey', () => {
    const provider = createAiProvider('gemini', { apiKey: 'dummy-key-for-test' });
    expect(provider.id).toBe('gemini');
  });

  it('throws for unknown provider', () => {
    expect(() => createAiProvider('non-existent')).toThrow('Provedor de IA desconhecido');
  });
});

describe('Helper Utilities', () => {
  it('cleans base64 data URLs correctly', () => {
    expect(cleanBase64('data:application/pdf;base64,JVBERi0xLjQK')).toBe('JVBERi0xLjQK');
    expect(cleanBase64('JVBERi0xLjQK')).toBe('JVBERi0xLjQK');
  });

  it('extracts JSON cleanly from markdown code blocks', () => {
    const raw = '```json\n{"score": 95, "title": "Senior"}\n```';
    const parsed = extractJsonFromResponse<{ score: number; title: string }>(raw);
    expect(parsed.score).toBe(95);
    expect(parsed.title).toBe('Senior');
  });

  it('extracts JSON surrounded by preamble text', () => {
    const raw = 'Here is the analysis:\n{"ok": true}\nHope this helps!';
    const parsed = extractJsonFromResponse<{ ok: boolean }>(raw);
    expect(parsed.ok).toBe(true);
  });
});
