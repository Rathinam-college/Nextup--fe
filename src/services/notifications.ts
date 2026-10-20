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

/**
 * Calculates ms until the next 9:00 AM in the user's local timezone
 */
export function getMsUntilNext9AM(): number {
  const now = new Date();
  const next9AM = new Date(now);
  next9AM.setHours(9, 0, 0, 0);

  // If already past 9:00 AM today, schedule for 9:00 AM tomorrow
  if (now.getTime() >= next9AM.getTime()) {
    next9AM.setDate(next9AM.getDate() + 1);
  }

  return next9AM.getTime() - now.getTime();
}

/**
 * Schedules recurring daily 9:00 AM morning work update reminders
 */
export function startDaily9AMReminderSchedule(): void {
  if (dailyTimerId) {
    clearTimeout(dailyTimerId as any);
    dailyTimerId = null;
  }

  const msUntil9AM = getMsUntilNext9AM();
  const hoursUntil = (msUntil9AM / (1000 * 60 * 60)).toFixed(1);
  console.log(`[WebNotifications] Daily 9:00 AM reminder scheduled in ~${hoursUntil} hours.`);

  dailyTimerId = setTimeout(async () => {
    // 1. Show browser notification
    showBrowserNotification('☀️ 9:00 AM Daily Work Update Reminder', {
      body: "Good morning! It's 9:00 AM. Please update your work report and task deliverables for today.",
      tag: 'daily-work-update-9am',
    });

    // 2. Trigger backend notification dispatch so it records in in-app alerts and audit log
    try {
      await api.triggerDailyReminder();
    } catch {
      // ignore
    }

    // 3. Reschedule for tomorrow 9:00 AM
    startDaily9AMReminderSchedule();
  }, msUntil9AM);
}

/**
 * Cancels active daily reminder timer
 */
export function stopDaily9AMReminderSchedule(): void {
  if (dailyTimerId) {
    clearTimeout(dailyTimerId as any);
    dailyTimerId = null;
  }
}

/**
 * Triggers an immediate test 9:00 AM notification
 * Used for instant verification in settings / notification panel
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
    showBrowserNotification('☀️ Daily Work Update Reminder (Test)', {
      body: "Good morning! It's 9:00 AM. Please update your work report and task deliverables for today.",
      tag: 'daily-work-update-9am-test',
    });
  }

  // Also call backend API to create in-app notification entry
  let backendDispatched = 0;
  try {
    const res = await api.triggerDailyReminder(false);
    backendDispatched = res.dispatched_count;
  } catch (err: any) {
    console.warn('Backend trigger error:', err);
  }

  if (hasPermission) {
    return {
      success: true,
      message: 'Desktop notification sent! Also recorded in your notification bell panel.',
    };
  } else {
    return {
      success: true,
      message: `Notification created in your in-app notification panel (${backendDispatched} alert). Enable browser notifications to see desktop popups.`,
    };
  }
}
