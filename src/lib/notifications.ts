// Smart Hunter System Notification Engine

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

export interface QuietModeSettings {
  enabled: boolean;
  startHour: number; // 24-hour format, e.g. 22 for 10 PM
  endHour: number;   // 24-hour format, e.g. 7 for 7 AM
  allowUrgent: boolean;
}

export interface SmartNotificationConfig {
  quietMode: QuietModeSettings;
  soundEnabled: boolean;
  browserNotifications: boolean;
  inAppToasts: boolean;
  dailyReminderHour: number; // e.g., 9 for 9 AM
}

export interface HunterNotification {
  id: string;
  title: string;
  message: string;
  priority: NotificationPriority;
  timestamp: number;
  read: boolean;
  category?: 'system' | 'quest' | 'level_up' | 'rank_up' | 'warning';
}

const STORAGE_KEY_CONFIG = 'hunter_notification_config';
const STORAGE_KEY_LOGS = 'hunter_notification_logs';

export const DEFAULT_NOTIFICATION_CONFIG: SmartNotificationConfig = {
  quietMode: {
    enabled: true,
    startHour: 22,
    endHour: 7,
    allowUrgent: true,
  },
  soundEnabled: true,
  browserNotifications: false,
  inAppToasts: true,
  dailyReminderHour: 9,
};

export function getNotificationConfig(): SmartNotificationConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (!raw) return DEFAULT_NOTIFICATION_CONFIG;
    return { ...DEFAULT_NOTIFICATION_CONFIG, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_CONFIG;
  }
}

export function saveNotificationConfig(config: SmartNotificationConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save notification config:', err);
  }
}

/**
 * Checks if the current local time falls within configured quiet hours.
 */
export function isQuietModeActive(config = getNotificationConfig()): boolean {
  if (!config.quietMode.enabled) return false;

  const currentHour = new Date().getHours();
  const { startHour, endHour } = config.quietMode;

  if (startHour > endHour) {
    // Spans across midnight, e.g. 22:00 to 07:00
    return currentHour >= startHour || currentHour < endHour;
  } else {
    // Within same day, e.g. 13:00 to 15:00
    return currentHour >= startHour && currentHour < endHour;
  }
}

type NotificationSubscriber = (notification: HunterNotification) => void;
const subscribers = new Set<NotificationSubscriber>();

export function subscribeToNotifications(callback: NotificationSubscriber): () => void {
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

/**
 * Web Audio API synthesizer for high-tech System acoustic chime
 */
export function playSystemChime(type: 'quest' | 'level' | 'alert' = 'alert'): void {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'level') {
      // Ascending triumphant triad (E5 -> G#5 -> B5 -> E6)
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(830.61, now + 0.12);
      osc.frequency.exponentialRampToValueAtTime(987.77, now + 0.24);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.38);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
      osc.start(now);
      osc.stop(now + 0.9);
    } else if (type === 'quest') {
      // Crisp holographic quest chime
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1174.66, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    } else {
      // Tech notification ping
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.1);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    }
  } catch {
    // AudioContext blocked or not supported; ignore gracefully
  }
}

/**
 * Dispatches an in-game notification and schedules it based on priorities and quiet hours.
 */
export function scheduleNotification(options: {
  title: string;
  message: string;
  priority?: NotificationPriority;
  category?: 'system' | 'quest' | 'level_up' | 'rank_up' | 'warning';
  delayMs?: number;
  playSound?: boolean;
}): Promise<HunterNotification> {
  const {
    title,
    message,
    priority = 'normal',
    category = 'system',
    delayMs = 0,
    playSound = true,
  } = options;

  return new Promise((resolve) => {
    setTimeout(() => {
      const config = getNotificationConfig();
      const inQuiet = isQuietModeActive(config);

      // In quiet mode, suppress unless urgent or allowUrgent is true
      if (inQuiet && priority !== 'urgent' && !config.quietMode.allowUrgent) {
        console.info(`[Notification Suppressed: Quiet Mode Active] ${title}`);
      }

      const notification: HunterNotification = {
        id: 'notif-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
        title,
        message,
        priority,
        category,
        timestamp: Date.now(),
        read: false,
      };

      // Sound
      if (playSound && config.soundEnabled && (!inQuiet || priority === 'urgent')) {
        const chimeType = category === 'level_up' ? 'level' : category === 'quest' ? 'quest' : 'alert';
        playSystemChime(chimeType);
      }

      // Browser Notification if granted
      if (config.browserNotifications && typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted' && (!inQuiet || priority === 'urgent')) {
          new Notification(`[HUNTER SYSTEM] ${title}`, {
            body: message,
            icon: '/favicon.ico',
          });
        }
      }

      // Notify in-app subscribers
      subscribers.forEach((callback) => callback(notification));

      // Append to history log
      try {
        const rawLogs = localStorage.getItem(STORAGE_KEY_LOGS);
        const logs: HunterNotification[] = rawLogs ? JSON.parse(rawLogs) : [];
        logs.unshift(notification);
        // Keep max 50 recent notifications
        localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(logs.slice(0, 50)));
      } catch {
        // LocalStorage quota or access error
      }

      resolve(notification);
    }, Math.max(0, delayMs));
  });
}

export function getNotificationLogs(): HunterNotification[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
