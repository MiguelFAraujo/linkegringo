import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { track, getRecentEvents, clearTelemetry, toScoreBand } from './telemetry';

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
});
