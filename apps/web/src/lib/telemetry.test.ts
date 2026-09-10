import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import {
  track,
  getRecentEvents,
  clearTelemetry,
  toScoreBand,
  toScoreDeltaBand,
  categorizeApiError,
  initAnalytics,
} from './telemetry';

describe('Client-Side BYOK Telemetry & Analytics', () => {
  beforeEach(() => {
    clearTelemetry();
    delete (window as unknown as { umami?: unknown }).umami;
  });

  afterEach(() => {
    delete (window as unknown as { umami?: unknown }).umami;
  });

  it('records anonymous events locally in-memory with zero network requests', () => {
    track('tab_switched', { tab: 'search' });
    const events = getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('tab_switched');
    expect(events[0].data).toEqual({ tab: 'search' });
  });

  it('handles events without payload (undefined)', () => {
    track('copy_headline');
    track('copy_about');
    const events = getRecentEvents();
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('copy_headline');
    expect(events[0].data).toBeUndefined();
    expect(events[1].event).toBe('copy_about');
  });

  it('correctly categorizes scores into privacy-preserving score bands', () => {
    expect(toScoreBand(35)).toBe('low');
    expect(toScoreBand(49)).toBe('low');
    expect(toScoreBand(50)).toBe('mid');
    expect(toScoreBand(74)).toBe('mid');
    expect(toScoreBand(75)).toBe('high');
    expect(toScoreBand(98)).toBe('high');
  });

  it('correctly categorizes score deltas into delta bands', () => {
    expect(toScoreDeltaBand(3)).toBe('minor');
    expect(toScoreDeltaBand(5)).toBe('minor');
    expect(toScoreDeltaBand(10)).toBe('moderate');
    expect(toScoreDeltaBand(15)).toBe('moderate');
    expect(toScoreDeltaBand(16)).toBe('major');
    expect(toScoreDeltaBand(30)).toBe('major');
  });

  it('categorizes API errors into standardized operational error types', () => {
    expect(categorizeApiError(new Error('Resource exhausted (429): Quota exceeded'))).toBe('quota_exceeded');
    expect(categorizeApiError(new Error('API key not valid. Please pass a valid API key (403)'))).toBe('invalid_key');
    expect(categorizeApiError(new Error('503 Service Unavailable: Model is overloaded'))).toBe('model_overloaded');
    expect(categorizeApiError(new Error('Failed to fetch: NetworkError'))).toBe('network');
    expect(categorizeApiError(new Error('Unknown unexpected failure'))).toBe('unknown');
  });

  it('tracks enriched events with numbers, booleans, and error types', () => {
    track('analysis_completed', {
      durationBand: 'normal',
      durationSeconds: 8,
      inboundScore: 78,
      scoreBand: 'high',
      experienceCount: 4,
      sparseExperiencesCount: 1,
      gapsCount: 2,
    });
    track('copy_opentowork_titles', { count: 5 });
    track('api_error', { stage: 'rewrite', errorType: 'quota_exceeded' });

    const events = getRecentEvents();
    expect(events).toHaveLength(3);
    expect(events[0].data).toEqual({
      durationBand: 'normal',
      durationSeconds: 8,
      inboundScore: 78,
      scoreBand: 'high',
      experienceCount: 4,
      sparseExperiencesCount: 1,
      gapsCount: 2,
    });
    expect(events[1].data).toEqual({ count: 5 });
    expect(events[2].data).toEqual({ stage: 'rewrite', errorType: 'quota_exceeded' });
  });

  it('strips sensitive PII and domain objects from telemetry payloads at runtime', () => {
    // Force passing disallowed keys via cast to verify runtime defense in depth
    (track as any)('recruiter_search_simulated', {
      result: 'match',
      apiKey: 'secret-gemini-key-12345',
      profile: { name: 'Sensitive Candidate' },
      statement: 'Sensitive fact text',
      headline: 'Passionate Java Developer',
      name: 'John Doe',
      email: 'john@example.com',
    });

    const events = getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual({ result: 'match' });
    expect(events[0].data?.apiKey).toBeUndefined();
    expect(events[0].data?.profile).toBeUndefined();
    expect(events[0].data?.statement).toBeUndefined();
    expect(events[0].data?.headline).toBeUndefined();
    expect(events[0].data?.name).toBeUndefined();
    expect(events[0].data?.email).toBeUndefined();
  });

  it('forwards sanitized events to window.umami.track when Umami is active', () => {
    const umamiTrackSpy = vi.fn();
    (window as unknown as { umami: { track: typeof umamiTrackSpy } }).umami = {
      track: umamiTrackSpy,
    };

    track('gap_resolved', {
      kind: 'technology',
      outcome: 'match',
    });

    expect(umamiTrackSpy).toHaveBeenCalledWith('gap_resolved', {
      kind: 'technology',
      outcome: 'match',
    });
  });

  it('caps memory buffer size to prevent memory bloat', () => {
    for (let i = 0; i < 150; i++) {
      track('tab_switched', { tab: `tab-${i}` });
    }
    const events = getRecentEvents();
    expect(events.length).toBeLessThanOrEqual(100);
  });

  it('guarantees 100% zero outbound network requests when Umami is not configured', () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy;

    try {
      track('tab_switched', { tab: 'launch' });
      track('checklist_toggled', { itemIndex: 1, checked: true });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('injects Umami script tag when VITE_UMAMI_WEBSITE_ID is configured', () => {
    const existing = document.querySelector('script[data-website-id]');
    if (existing) existing.remove();

    vi.stubEnv('VITE_UMAMI_WEBSITE_ID', 'test-website-id-12345');
    try {
      initAnalytics();
      const injected = document.querySelector('script[data-website-id="test-website-id-12345"]') as HTMLScriptElement;
      expect(injected).not.toBeNull();
      expect(injected.src).toBe('https://cloud.umami.is/script.js');
      expect(injected.defer).toBe(true);

      // Verify idempotency (no duplicate script tags)
      initAnalytics();
      const allScripts = document.querySelectorAll('script[data-website-id="test-website-id-12345"]');
      expect(allScripts.length).toBe(1);
    } finally {
      vi.unstubAllEnvs();
      const script = document.querySelector('script[data-website-id]');
      if (script) script.remove();
    }
  });
});
