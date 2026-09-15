// Hunter System Telemetry & Analytics Engine

export enum AnalyticsEvent {
  AWAKENING_STARTED = 'AWAKENING_STARTED',
  AWAKENING_NAME_ENTERED = 'AWAKENING_NAME_ENTERED',
  AWAKENING_STAT_CHOSEN = 'AWAKENING_STAT_CHOSEN',
  AWAKENING_COMPLETED = 'AWAKENING_COMPLETED',
  SYSTEM_AWAKENED = 'SYSTEM_AWAKENED',
  STAT_SELECTED = 'STAT_SELECTED',
  QUEST_STARTED = 'QUEST_STARTED',
  QUEST_PROGRESS = 'QUEST_PROGRESS',
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  LEVEL_UP = 'LEVEL_UP',
  RANK_PROMOTION = 'RANK_PROMOTION',
  NOTIFICATION_DISPATCHED = 'NOTIFICATION_DISPATCHED',
  HUNTER_RESET = 'HUNTER_RESET',
}

export interface AnalyticsRecord {
  event: AnalyticsEvent;
  properties?: Record<string, unknown>;
  timestamp: string;
}

const STORAGE_KEY_ANALYTICS = 'hunter_analytics_records';

/**
 * Tracks and logs an analytics event with telemetry payload.
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, unknown>): void {
  const record: AnalyticsRecord = {
    event,
    properties,
    timestamp: new Date().toISOString(),
  };

  // Structured console telemetry for debugging
  console.groupCollapsed(`%c[SYSTEM TELEMETRY] ${event}`, 'color: #06b6d4; font-weight: bold; background: #0f172a; padding: 2px 6px; border-radius: 4px;');
  console.log('Timestamp:', record.timestamp);
  if (properties) console.table(properties);
  console.groupEnd();

  // Persist to local storage buffer (keep up to 100 recent events)
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANALYTICS);
    const records: AnalyticsRecord[] = raw ? JSON.parse(raw) : [];
    records.push(record);
    localStorage.setItem(STORAGE_KEY_ANALYTICS, JSON.stringify(records.slice(-100)));
  } catch {
    // Quota reached or private mode
  }
}

/**
 * Returns recorded telemetry events.
 */
export function getAnalyticsRecords(): AnalyticsRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ANALYTICS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
