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
    // Attempt playback of default notification audio chime file
    const soundUrls = ['/nextup/notification.wav', '/notification.wav'];
    const audio = new Audio(window.location.pathname.startsWith('/nextup') ? soundUrls[0] : soundUrls[1]);
    audio.volume = 0.8;
    const playPromise = audio.play();
    if (playPromise) {
      playPromise.catch(() => {
        // Fallback to Web Audio synthesis if HTML5 audio fails
        playWebAudioSynth();
      });
      return;
    }
  } catch {
    // Fallback to Web Audio synthesis
  }
  playWebAudioSynth();
}

function playWebAudioSynth(): void {
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

// Institutional Work Policy:
// 1-hour recurring reminders are disabled per policy.
// Scheduled daily work emails and notifications are managed on the server
// and fire strictly at 9:00 AM (Start) and 6:00 PM (Wrap-Up) IST (Monday – Saturday).
let hourlyTimerId: ReturnType<typeof setTimeout> | number | null = null;

/**
 * Institutional Schedule:
 * Automated shift briefings (9:00 AM Start & 6:00 PM Wrap-Up) are server-managed.
 * Continuous 1-hour recurring timers have been disabled.
 */
export function startHourlyReminderSchedule(): void {
  if (hourlyTimerId) {
    clearTimeout(hourlyTimerId as any);
    hourlyTimerId = null;
  }
  console.log('[WebNotifications] Routine 1-hour reminders are disabled. Daily briefings fire at 9:00 AM & 6:00 PM IST.');
}

/**
 * Backward-compatible alias for startHourlyReminderSchedule
 */
export function startDaily9AMReminderSchedule(): void {
  startHourlyReminderSchedule();
}

/**
 * Cancels active reminder timer
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

/**
 * Dispatch desktop browser notification & sound chime for a note reminder
 */
export function notifyNoteReminder(noteTitle: string, noteContent?: string): void {
  playNotificationChime();
  showBrowserNotification(`⏰ Note Reminder: ${noteTitle}`, {
    body: noteContent ? (noteContent.length > 140 ? `${noteContent.slice(0, 140)}...` : noteContent) : `You have a scheduled reminder for note: ${noteTitle}`,
    tag: `note-reminder-${Date.now()}`,
  });
}

