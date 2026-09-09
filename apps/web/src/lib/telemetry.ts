import type { GapTermKind } from '@linkegringo/core';

/**
 * Client-Side BYOK Privacy-Preserved Telemetry.
 * 
 * Invariant Guarantees:
 * 1. Zero PII, secrets, or profile content sent to any external service.
 *    LinkeGringo never transmits profile contents, interview answers, PDF contents, or API keys.
 * 2. Type-safe Event Map strictly enforced at compile time.
 * 3. Anonymous Umami adapter (window.umami) activated only when configured.
 * 4. Local in-memory session logging capped at 100 entries.
 */

export interface TelemetryEventMap {
  // Funnel: Upload -> Diagnosis
  pdf_uploaded: { source: 'upload' | 'demo' };
  target_role_selected: { roleCategory: string };
  analysis_started: { source: 'upload' | 'demo' };
  analysis_completed: { durationBand: 'fast' | 'normal' | 'slow' };
  diagnosis_viewed: { scoreBand: 'low' | 'mid' | 'high' };

  // Funnel: Interview
  interview_started: { questionCount: number };
  interview_skipped: undefined;
  interview_completed: { answeredCount: number };

  // Funnel: Rewrite
  rewrite_completed: undefined;
  action_hub_viewed: { initialScoreBand: 'low' | 'mid' | 'high' };

  // Navigation
  tab_switched: { tab: string };

  // Search Simulator & Micro-Integrations
  search_tab_opened: undefined;
  search_query_run: { result: 'match' | 'weak' | 'missing' };
  recruiter_search_simulated: { result: 'match' | 'weak' | 'missing' };
  micro_integration_started: { kind: GapTermKind };
  micro_integration_applied: { kind: GapTermKind; outcome: 'match' | 'no_safe_change' };
  gap_resolved: { kind: GapTermKind; outcome: 'match' | 'no_safe_change' };

  // Actions / Value delivery
  copy_headline: undefined;
  copy_about: undefined;
  copy_experience: undefined;
  copy_skills: undefined;

  // Launch Checklist
  launch_started: undefined;
  launch_completed: undefined;
  checklist_toggled: { itemIndex: number; checked: boolean };
}

export type TelemetryEventType = keyof TelemetryEventMap;

export interface TelemetryRecord {
  timestamp: number;
  event: TelemetryEventType;
  data?: Record<string, unknown>;
}

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, unknown>) => void;
    };
  }
}

const MAX_LOG_SIZE = 100;
const eventLog: TelemetryRecord[] = [];

const BLOCKED_KEYS = new Set([
  'profile',
  'pdf',
  'pdfbase64',
  'pdftext',
  'cvpdfbase64',
  'apikey',
  'key',
  'token',
  'secret',
  'answer',
  'answers',
  'facts',
  'statement',
  'summary',
  'headline',
  'experience',
  'experiences',
  'bullets',
  'description',
  'name',
  'email',
  'company',
]);

export function toScoreBand(score: number): 'low' | 'mid' | 'high' {
  if (score < 50) return 'low';
  if (score < 75) return 'mid';
  return 'high';
}

export function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (BLOCKED_KEYS.has(key) || BLOCKED_KEYS.has(key.toLowerCase())) {
      continue;
    }
    if (typeof value === 'string') {
      if (value.length > 100) continue; // Drop long text
      safe[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
  }

  return safe;
}

export function track<E extends keyof TelemetryEventMap>(
  event: E,
  ...args: TelemetryEventMap[E] extends undefined ? [data?: undefined] : [data: TelemetryEventMap[E]]
): void {
  const data = args[0] as Record<string, unknown> | undefined;
  const cleanData = sanitizeData(data);

  const record: TelemetryRecord = {
    timestamp: Date.now(),
    event,
    data: cleanData,
  };

  eventLog.push(record);
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.shift();
  }

  // External anonymous analytics dispatch (if Umami script is active)
  try {
    if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
      window.umami.track(event, cleanData);
    }
  } catch {
    // Fail silently: analytics must never disrupt app functionality
  }
}

export function toDurationBand(ms: number): 'fast' | 'normal' | 'slow' {
  if (ms < 5000) return 'fast';
  if (ms < 15000) return 'normal';
  return 'slow';
}

export function getRecentEvents(): ReadonlyArray<TelemetryRecord> {
  return [...eventLog];
}

export function clearTelemetry(): void {
  eventLog.length = 0;
}

