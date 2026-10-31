import { Task } from '../types';

/**
 * Normalizes phone numbers to international format required by WhatsApp (wa.me)
 * Supports Indian 10-digit numbers (auto-prepends 91) and existing country codes.
 */
export const formatWhatsAppPhone = (rawPhone: string): string => {
  if (!rawPhone) return '';
  const cleaned = rawPhone.replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // 10-digit Indian mobile number starting with 6, 7, 8, or 9
  if (cleaned.length === 10 && /^[6-9]/.test(cleaned)) {
    return `91${cleaned}`;
  }

  // 11-digit number starting with 0 (e.g. 09876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return `91${cleaned.slice(1)}`;
  }

  return cleaned;
};

/**
 * Builds a clear, formatted WhatsApp alert message for all urgent tasks assigned to a staff member
 */
export const formatWhatsAppUrgentTasksMessage = (staffName: string, tasks: Task[]): string => {
  let msg = `🚨 *URGENT TASKS ALERT - GM Office* 🚨\n`;
  msg += `Dear *${staffName}*,\n\n`;
  msg += `The General Manager has flagged the following *${tasks.length} urgent task${tasks.length > 1 ? 's' : ''}* requiring your immediate attention and closure:\n\n`;

  tasks.forEach((t, idx) => {
    const isUrgent = t.priority === 'URGENT';
    const priIcon = isUrgent ? '🔴 [URGENT]' : '⚡ [HIGH]';
    msg += `${idx + 1}. ${priIcon} *#${t.id}: ${t.title}*\n`;
    if (t.department_name) {
      msg += `   • 🏢 Dept: ${t.department_name}\n`;
    }
    msg += `   • 📊 Status: ${(t.status_display || t.status || '').replace(/_/g, ' ')}\n`;
    msg += `   • ⏰ Due: ${t.due_date || 'Immediate Attention'}\n`;
    if (t.description && t.description.trim()) {
      const shortDesc = t.description.trim().slice(0, 80);
      msg += `   • 📝 Specs: ${shortDesc}${t.description.length > 80 ? '...' : ''}\n`;
    }
    msg += `\n`;
  });

  msg += `━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔗 *Open in NextUp*: https://www.rguedu.in/nextup/\n\n`;
  msg += `_Please attend to these immediately and update your progress or submit proof for GM sign-off._\n`;
  msg += `— *Office of the General Manager*`;

  return msg;
};

/**
 * Builds a formatted WhatsApp message for a single urgent task
 */
export const formatWhatsAppSingleTaskMessage = (staffName: string, task: Task): string => {
  let msg = `🚨 *URGENT TASK ACTION REQUIRED* 🚨\n`;
  msg += `Dear *${staffName}*,\n\n`;
  msg += `The General Manager requires your immediate action on task *#${task.id}*:\n\n`;
  msg += `📌 *Title*: ${task.title}\n`;
  msg += `🏢 *Department*: ${task.department_name || task.department_code}\n`;
  msg += `⚡ *Priority*: ${task.priority_display || task.priority}\n`;
  msg += `📊 *Status*: ${(task.status_display || task.status || '').replace(/_/g, ' ')}\n`;
  msg += `⏰ *Due Date*: ${task.due_date || 'Immediate'}\n`;
  if (task.description && task.description.trim()) {
    msg += `📝 *Instructions*: ${task.description.trim()}\n`;
  }
  msg += `\n━━━━━━━━━━━━━━━━━━━━━\n`;
  msg += `🔗 *Open Task*: https://www.rguedu.in/nextup/\n\n`;
  msg += `_Please review and update progress in NextUp._\n`;
  msg += `— *Office of the General Manager*`;
  return msg;
};

/**
 * Opens WhatsApp Web or WhatsApp Desktop with pre-filled message
 */
export const openWhatsApp = (phone: string, message: string): void => {
  const cleanPhone = formatWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;
  window.open(url, '_blank');
};
