import type { RemoteGeminiModel } from '@linkegringo/ai';

const STORAGE_KEYS = {
  API_KEY: 'linkegringo_gemini_api_key',
  PROVIDER_ID: 'linkegringo_provider_id',
  MODEL: 'linkegringo_gemini_model',
  CACHED_MODELS: 'linkegringo_cached_gemini_models',
  SESSION: 'linkegringo_active_session',
  ONBOARDING_SEEN: 'linkegringo_onboarding_seen',
};

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(key: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
  } catch (err) {
    console.warn('[storage] Failed to save api key to localStorage:', err);
  }
}

export function clearStoredApiKey(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.API_KEY);
  } catch (err) {
    console.warn('[storage] Failed to clear api key:', err);
  }
}

export function getStoredProviderId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.PROVIDER_ID) || 'gemini';
  } catch {
    return 'gemini';
  }
}

export function setStoredProviderId(providerId: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PROVIDER_ID, providerId);
  } catch (err) {
    console.warn('[storage] Failed to save provider id:', err);
  }
}

export function getStoredModel(): string {
  try {
    const val = localStorage.getItem(STORAGE_KEYS.MODEL);
    if (val && val !== 'gemini-2.0-flash') {
      return val;
    }
    return 'gemini-2.5-flash';
  } catch {
    return 'gemini-2.5-flash';
  }
}

export function setStoredModel(model: string): void {
  try {
    const cleanModel = model && model !== 'gemini-2.0-flash' ? model : 'gemini-2.5-flash';
    localStorage.setItem(STORAGE_KEYS.MODEL, cleanModel);
  } catch (err) {
    console.warn('[storage] Failed to save model:', err);
  }
}


export interface CachedGeminiModelsData {
  apiKeyHash: string;
  models: RemoteGeminiModel[];
  cachedAt?: number;
}

export function hashApiKey(key: string): string {
  const trimmed = key.trim();
  let hash = 0;
  for (let i = 0; i < trimmed.length; i++) {
    hash = ((hash << 5) - hash) + trimmed.charCodeAt(i);
    hash |= 0;
  }
  return `h_${Math.abs(hash).toString(36)}_${trimmed.length}`;
}

export function getCachedGeminiModels(apiKey?: string): CachedGeminiModelsData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CACHED_MODELS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedGeminiModelsData;
    if (!parsed || !Array.isArray(parsed.models)) return null;
    if (apiKey !== undefined) {
      const trimmed = apiKey.trim();
      if (!trimmed) return null;
      if (parsed.apiKeyHash !== hashApiKey(trimmed)) {
        return null;
      }
    }
    return parsed;
  } catch {
    return null;
  }
}

export function setCachedGeminiModels(apiKey: string, models: RemoteGeminiModel[]): void {
  try {
    const payload: CachedGeminiModelsData = {
      apiKeyHash: hashApiKey(apiKey),
      models,
      cachedAt: Date.now(),
    };
    localStorage.setItem(STORAGE_KEYS.CACHED_MODELS, JSON.stringify(payload));
  } catch (err) {
    console.warn('[storage] Failed to save cached gemini models:', err);
  }
}

export function clearCachedGeminiModels(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.CACHED_MODELS);
  } catch (err) {
    console.warn('[storage] Failed to clear cached gemini models:', err);
  }
}


export function getStoredSession<T>(): T | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function saveStoredSession<T>(data: T): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(data));
  } catch (err) {
    console.warn('[storage] Failed to save session:', err);
  }
}

export function clearStoredSession(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  } catch (err) {
    console.warn('[storage] Failed to clear session:', err);
  }
}

export function hasSeenOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ONBOARDING_SEEN) === 'true';
  } catch {
    return false;
  }
}

export function setOnboardingSeen(seen: boolean = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ONBOARDING_SEEN, seen ? 'true' : 'false');
  } catch (err) {
    console.warn('[storage] Failed to save onboarding seen:', err);
  }
}
