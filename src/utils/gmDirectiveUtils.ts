import { Task } from '../types';

export type GmDirectiveChannel = 'PHONE' | 'EMAIL' | 'IN_PERSON' | 'MESSAGE' | 'DIRECT' | 'NONE';

export interface GmDirectiveInfo {
  isAssignedByGm: boolean;
  channel: GmDirectiveChannel;
  channelDisplay: string;
  channelIcon: string;
  directiveNotes?: string;
}

export function parseGmDirective(task?: Partial<Task> | null): GmDirectiveInfo {
  if (!task) {
    return {
      isAssignedByGm: false,
      channel: 'NONE',
      channelDisplay: 'Internal / Self',
      channelIcon: '👤',
    };
  }

  // 1. Check direct backend fields if available
  if (task.gm_directive_channel && task.gm_directive_channel !== 'NONE') {
    const channel = task.gm_directive_channel as GmDirectiveChannel;
    const channelMap: Record<string, { display: string; icon: string }> = {
      PHONE: { display: 'Phone Call', icon: '📞' },
      EMAIL: { display: 'Email', icon: '📧' },
      IN_PERSON: { display: 'In-Person / Verbal', icon: '🗣️' },
      MESSAGE: { display: 'WhatsApp / Message', icon: '💬' },
      DIRECT: { display: 'Direct GM Directive', icon: '🏛️' },
    };
    const mapped = channelMap[channel] || { display: 'GM Directive', icon: '🏛️' };
    return {
      isAssignedByGm: true,
      channel,
      channelDisplay: mapped.display,
      channelIcon: mapped.icon,
    };
  }

  // 2. Parse from description comment <!-- GM_DIRECTIVE:(.*?) -->
  const desc = task.description || '';
  const match = desc.match(/<!-- GM_DIRECTIVE:(.*?) -->/);
  if (match && match[1]) {
    try {
      const raw = match[1].trim();
      if (raw.startsWith('{')) {
        const parsed = JSON.parse(raw);
        const channel: GmDirectiveChannel = parsed.channel || 'DIRECT';
        const channelMap: Record<string, { display: string; icon: string }> = {
          PHONE: { display: 'Phone Call', icon: '📞' },
          EMAIL: { display: 'Email', icon: '📧' },
          IN_PERSON: { display: 'In-Person / Verbal', icon: '🗣️' },
          MESSAGE: { display: 'WhatsApp / Message', icon: '💬' },
          DIRECT: { display: 'Direct GM Directive', icon: '🏛️' },
        };
        const mapped = channelMap[channel] || { display: 'GM Directive', icon: '🏛️' };
        return {
          isAssignedByGm: true,
          channel,
          channelDisplay: mapped.display,
          channelIcon: mapped.icon,
          directiveNotes: parsed.notes,
        };
      } else {
        const channel = raw as GmDirectiveChannel;
        const channelMap: Record<string, { display: string; icon: string }> = {
          PHONE: { display: 'Phone Call', icon: '📞' },
          EMAIL: { display: 'Email', icon: '📧' },
          IN_PERSON: { display: 'In-Person / Verbal', icon: '🗣️' },
          MESSAGE: { display: 'WhatsApp / Message', icon: '💬' },
          DIRECT: { display: 'Direct GM Directive', icon: '🏛️' },
        };
        const mapped = channelMap[channel] || { display: 'GM Directive', icon: '🏛️' };
        return {
          isAssignedByGm: true,
          channel,
          channelDisplay: mapped.display,
          channelIcon: mapped.icon,
        };
      }
    } catch {}
  }

  // 3. Fallback: If task was created by GM or Super Admin, it's a direct GM assignment
  if (task.created_by_role === 'GENERAL_MANAGER' || task.created_by_role === 'SUPER_ADMIN') {
    return {
      isAssignedByGm: true,
      channel: 'DIRECT',
      channelDisplay: 'Direct GM Directive',
      channelIcon: '🏛️',
    };
  }

  // 4. Default: Internal / Self
  return {
    isAssignedByGm: false,
    channel: 'NONE',
    channelDisplay: 'Internal / Self',
    channelIcon: '👤',
  };
}

export function cleanDirectiveDesc(desc?: string | null): string {
  if (!desc) return '';
  return desc.replace(/<!-- GM_DIRECTIVE:.*?-->/gs, '').trim();
}

export function buildGmDirectiveMetadata(channel: GmDirectiveChannel, notes?: string): string {
  if (channel === 'NONE') return '';
  return `<!-- GM_DIRECTIVE:${JSON.stringify({ channel, notes: notes ? notes.trim() : '' })} -->\n`;
}

