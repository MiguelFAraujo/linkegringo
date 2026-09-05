import { describe, expect, it, beforeEach } from 'vitest';
import {
  getCachedGeminiModels,
  setCachedGeminiModels,
  clearCachedGeminiModels,
  getStoredModel,
  setStoredModel,
  hashApiKey,
} from './storage';
import type { RemoteGeminiModel } from '@linkegringo/ai';

const sampleModels: RemoteGeminiModel[] = [
  {
    id: 'gemini-3.5-flash',
    displayName: 'Gemini 3.5 Flash',
    description: 'Rápido',
    supportedGenerationMethods: ['generateContent'],
    badge: 'Recomendado',
  },
];

describe('Storage Helpers - Gemini Models Cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('generates consistent hashes for api keys', () => {
    const hash1 = hashApiKey('key-12345');
    const hash2 = hashApiKey('key-12345');
    const hash3 = hashApiKey('key-67890');

    expect(hash1).toBe(hash2);
    expect(hash1).not.toBe(hash3);
  });

  it('stores and retrieves cached models for matching apiKey', () => {
    setCachedGeminiModels('test-key-abc', sampleModels);

    const cached = getCachedGeminiModels('test-key-abc');
    expect(cached).not.toBeNull();
    expect(cached?.models).toHaveLength(1);
    expect(cached?.models[0].id).toBe('gemini-3.5-flash');
  });

  it('returns null when checking cache with a different apiKey', () => {
    setCachedGeminiModels('test-key-abc', sampleModels);

    const cachedMismatch = getCachedGeminiModels('different-key');
    expect(cachedMismatch).toBeNull();
  });

  it('returns null when checking cache with empty or whitespace key', () => {
    setCachedGeminiModels('test-key-abc', sampleModels);

    expect(getCachedGeminiModels('')).toBeNull();
    expect(getCachedGeminiModels('   ')).toBeNull();
  });

  it('clears cached models', () => {
    setCachedGeminiModels('test-key-abc', sampleModels);
    clearCachedGeminiModels();

    expect(getCachedGeminiModels('test-key-abc')).toBeNull();
    expect(getCachedGeminiModels()).toBeNull();
  });

  it('stores and retrieves selected model, falling back to gemini-3.5-flash for invalid models', () => {
    expect(getStoredModel()).toBe('gemini-3.5-flash'); // default fallback

    setStoredModel('gemini-3.6-flash');
    expect(getStoredModel()).toBe('gemini-3.6-flash');

    setStoredModel('gemini-2.0-flash');
    expect(getStoredModel()).toBe('gemini-3.5-flash'); // falls back because 2.0 is outside 3.5-3.8 flash
  });
});
