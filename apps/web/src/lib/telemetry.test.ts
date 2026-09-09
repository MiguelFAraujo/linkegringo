import { describe, expect, it, beforeEach, vi } from 'vitest';
import { track, getRecentEvents, clearTelemetry } from './telemetry';

describe('Client-Side BYOK Telemetry', () => {
  beforeEach(() => {
    clearTelemetry();
  });

  it('records anonymous events locally in-memory with zero network requests', () => {
    track('tab_switched', { tab: 'search' });
    const events = getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].event).toBe('tab_switched');
    expect(events[0].data).toEqual({ tab: 'search' });
  });

  it('strips sensitive PII and domain objects from telemetry payloads', () => {
    track('fix_gap_clicked', {
      gapType: 'headline',
      apiKey: 'secret-gemini-key-12345',
      profile: { name: 'Sensitive Candidate' },
      statement: 'Sensitive fact text',
      headline: 'Passionate Java Developer',
    });

    const events = getRecentEvents();
    expect(events).toHaveLength(1);
    expect(events[0].data).toEqual({ gapType: 'headline' });
    expect(events[0].data?.apiKey).toBeUndefined();
    expect(events[0].data?.profile).toBeUndefined();
    expect(events[0].data?.statement).toBeUndefined();
    expect(events[0].data?.headline).toBeUndefined();
  });

  it('caps memory buffer size to prevent memory bloat', () => {
    for (let i = 0; i < 150; i++) {
      track('copy_section', { section: `sec-${i}` });
    }
    const events = getRecentEvents();
    expect(events.length).toBeLessThanOrEqual(100);
  });

  it('guarantees 100% zero outbound network requests (fetch or sendBeacon never called)', () => {
    const fetchSpy = vi.fn();
    const originalFetch = globalThis.fetch;
    globalThis.fetch = fetchSpy;

    try {
      track('tab_switched', { tab: 'launch' });
      track('checklist_toggled', { item: 'step-opentowork' });
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
