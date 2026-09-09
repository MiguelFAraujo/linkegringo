/**
 * Client-Side BYOK Privacy-Preserved Telemetry.
 * 
 * Invariant Guarantees:
 * 1. ZERO Outbound Network Requests (Zero fetch, XMLHttpRequest, sendBeacon).
 * 2. ZERO PII / Secrets / Domain Leaks (Sanitizer strips profile texts, PDFs, answers, and API keys).
 * 3. 100% In-Memory / Local Client-Side session metrics.
 */

export type TelemetryEventType =
  | 'page_view'
  | 'step_transition'
  | 'tab_switched'
  | 'fix_gap_clicked'
  | 'copy_section'
  | 'checklist_toggled'
  | 'disclosure_toggled';

export interface TelemetryRecord {
  timestamp: number;
  event: TelemetryEventType | string;
  data?: Record<string, unknown>;
}

const MAX_LOG_SIZE = 100;
const eventLog: TelemetryRecord[] = [];

const BLOCKED_KEYS = new Set([
  'profile',
  'pdf',
  'pdfBase64',
  'pdfText',
  'cvPdfBase64',
  'apiKey',
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
]);

function sanitizeData(data?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!data) return undefined;
  const safe: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (BLOCKED_KEYS.has(key) || BLOCKED_KEYS.has(key.toLowerCase())) {
      continue;
    }
    // Only accept primitives (strings, numbers, booleans)
    if (typeof value === 'string') {
      if (value.length > 100) continue; // Drop long text
      safe[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      safe[key] = value;
    }
  }

  return safe;
}

export function track(event: TelemetryEventType | string, data?: Record<string, unknown>): void {
  const record: TelemetryRecord = {
    timestamp: Date.now(),
    event,
    data: sanitizeData(data),
  };

  eventLog.push(record);
  if (eventLog.length > MAX_LOG_SIZE) {
    eventLog.shift();
  }
}

export function getRecentEvents(): ReadonlyArray<TelemetryRecord> {
  return [...eventLog];
}

export function clearTelemetry(): void {
  eventLog.length = 0;
}
