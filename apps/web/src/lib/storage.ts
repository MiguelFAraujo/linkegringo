const STORAGE_KEYS = {
  API_KEY: 'linkegringo_gemini_api_key',
  PROVIDER_ID: 'linkegringo_provider_id',
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
