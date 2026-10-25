import { api } from './api';

let dailyTimerId: ReturnType<typeof setTimeout> | number | null = null;

/**
 * Check if the browser supports Desktop Notifications API
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermissionStatus(): NotificationPermission | 'unsupported' {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from user
 */
export async function requestBrowserNotificationPermission(): Promise<boolean> {
  if (!isNotificationSupported()) return false;
  try {
    const perm = await Notification.requestPermission();
    return perm === 'granted';
  } catch (err) {
    console.warn('[WebNotifications] Permission error:', err);
    return false;
  }
}

/**
 * Synthesizes a subtle, pleasant audio chime using the Web Audio API
 */
export function playNotificationChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(880, ctx.currentTime); // A5
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.2); // D6

    gainNode.gain.setValueAtTime(0.01, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(ctx.currentTime);
    osc2.start(ctx.currentTime + 0.05);

    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  } catch {
    // Audio optional / silenced by browser autoplay policies
  }
}

/**
 * Shows an immediate browser notification if permission is granted
 */
export function showBrowserNotification(
  title: string,
  options?: NotificationOptions
): Notification | null {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }

  try {
    playNotificationChime();
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'tasktracker-work-reminder',
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.warn('[WebNotifications] Display error:', err);
    return null;
  }
}

const ONE_HOUR_MS = 60 * 60 * 1000; // 3,600,000 ms (1 Hour)
let hourlyTimerId: ReturnType<typeof setTimeout> | number | null = null;

/**
 * Schedules continuous 1-hour recurring work update reminders
 * Fires every 1 hour continuously as long as the application is active
 */
export function startHourlyReminderSchedule(): void {
  if (hourlyTimerId) {
    clearTimeout(hourlyTimerId as any);
    hourlyTimerId = null;
  }

  const lastTimestampStr = typeof window !== 'undefined' ? localStorage.getItem('nextup_last_hourly_reminder') : null;
  let initialDelay = ONE_HOUR_MS;
  if (lastTimestampStr) {
    const lastTime = parseInt(lastTimestampStr, 10);
    if (!isNaN(lastTime)) {
      const elapsed = Date.now() - lastTime;
      if (elapsed > 0 && elapsed < ONE_HOUR_MS) {
        initialDelay = ONE_HOUR_MS - elapsed;
      }
    }
  }

  console.log(`[WebNotifications] Continuous 1-hour work reminder scheduled (next alert in ~${(initialDelay / 60000).toFixed(1)} mins).`);

  const fireReminder = async () => {
    // 1. Show browser desktop notification
    showBrowserNotification('⏰ Hourly Work Update Reminder', {
      body: "Time for your 1-hour check-in! Please update your active tasks, progress reports, and deliverables for today.",
      tag: 'hourly-work-update-reminder',
    });

    // 2. Play subtle pleasant chime
    playNotificationChime();

    // 3. Trigger backend dispatch for in-app notification center & compliance trail
    try {
      await api.triggerHourlyReminder(false);
    } catch {
      // ignore
    }

    // 4. Save timestamp to localStorage
    try {
      localStorage.setItem('nextup_last_hourly_reminder', Date.now().toString());
    } catch {}

    // 5. Reschedule continuously for the next 1 hour (3600000 ms)
    hourlyTimerId = setTimeout(fireReminder, ONE_HOUR_MS);
  };

  hourlyTimerId = setTimeout(fireReminder, initialDelay);
}

/**
 * Backward-compatible alias for startHourlyReminderSchedule
 */
export function startDaily9AMReminderSchedule(): void {
  startHourlyReminderSchedule();
}

/**
 * Cancels active continuous hourly reminder timer
 */
export function stopHourlyReminderSchedule(): void {
  if (hourlyTimerId) {
    clearTimeout(hourlyTimerId as any);
    hourlyTimerId = null;
  }
}

/**
 * Backward-compatible alias for stopHourlyReminderSchedule
 */
export function stopDaily9AMReminderSchedule(): void {
  stopHourlyReminderSchedule();
}

/**
 * Triggers an immediate test 1-hour notification
 * Used for instant verification in notification panel & settings
 */
export async function triggerTestWorkReminder(): Promise<{ success: boolean; message: string }> {
  let hasPermission = false;
  if (isNotificationSupported()) {
    if (Notification.permission === 'granted') {
      hasPermission = true;
    } else if (Notification.permission === 'default') {
      hasPermission = await requestBrowserNotificationPermission();
    }
  }

  if (hasPermission) {
    showBrowserNotification('⏰ Hourly Work Update Reminder (Test)', {
      body: "Time for your 1-hour check-in! Please update your active tasks, progress reports, and deliverables for today.",
      tag: 'hourly-work-update-test',
    });
  }

  // Also call backend API to create in-app notification entry
  let backendDispatched = 0;
  try {
    const res = await api.triggerHourlyReminder(false);
    backendDispatched = res.dispatched_count;
  } catch (err: any) {
    console.warn('Backend trigger error:', err);
  }

  if (hasPermission) {
    return {
      success: true,
      message: 'Continuous 1-hour desktop notification sent! Also recorded in your notification bell panel.',
    };
  } else {
    return {
      success: true,
      message: `Notification created in your in-app notification panel (${backendDispatched} alert). Enable browser notifications to see desktop popups.`,
    };
  }
}

