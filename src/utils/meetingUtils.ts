import { Task } from '../types';

export interface MeetingAttendee {
  id?: number | string | null;
  name: string;
  email?: string;
  deptName?: string;
}

export interface MeetingData {
  isMeeting: boolean;
  meetingTime?: string; // ISO string e.g. "2026-11-12T10:30"
  meetingEndTime?: string; // ISO string
  meetingLink?: string; // e.g. "https://meet.google.com/abc-defg-hij"
  location?: string;
  attendees?: MeetingAttendee[];
}

/**
 * Parses meeting metadata embedded in task description or checks [MEETING] tag.
 */
export function parseMeetingData(task?: Task | null): MeetingData {
  if (!task) {
    return { isMeeting: false };
  }

  const desc = task.description || '';
  const title = task.title || '';

  const data: MeetingData = {
    isMeeting: false,
    location: 'Google Meet',
    attendees: [],
  };

  const match = desc.match(/<!-- MEETING_DATA:(.*?) -->/);
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed && typeof parsed === 'object') {
        data.isMeeting = true;
        data.meetingTime = parsed.meetingTime || parsed.meeting_time || '';
        data.meetingEndTime = parsed.meetingEndTime || parsed.meeting_end_time || '';
        data.meetingLink = parsed.meetingLink || parsed.meeting_link || '';
        data.location = parsed.location || 'Google Meet';
        data.attendees = Array.isArray(parsed.attendees) ? parsed.attendees : [];
      }
    } catch {}
  }

  if (!data.isMeeting && (/\[MEETING\]/i.test(title) || /^MEETING:/i.test(title))) {
    data.isMeeting = true;
    if (task.due_date && !data.meetingTime) {
      data.meetingTime = `${task.due_date}T10:00`;
    }
  }

  // Populate attendee from assigned_to if empty
  if (data.isMeeting && (!data.attendees || data.attendees.length === 0) && task.assigned_to_name) {
    data.attendees = [
      {
        id: task.assigned_to,
        name: task.assigned_to_name,
        email: task.assigned_to_email,
        deptName: task.department_name,
      },
    ];
  }

  return data;
}

/**
 * Generates a one-click Google Calendar Add Event URL with pre-filled title,
 * start/end date-times, description, location (Google Meet), and attendee invites.
 */
export function buildGoogleCalendarUrl(
  title: string,
  meetingData: MeetingData,
  cleanDescription: string = ''
): string {
  const cleanTitle = title.replace(/\[MEETING\]\s*/i, '').trim();
  const eventTitle = cleanTitle ? `Meeting: ${cleanTitle}` : 'Scheduled Meeting';

  const parseToGCalDate = (val?: string) => {
    if (!val) return null;
    const clean = val.replace('Z', '').split('.')[0];
    const d = new Date(clean);
    if (isNaN(d.getTime())) return null;
    return d;
  };

  const start = parseToGCalDate(meetingData.meetingTime) || new Date(Date.now() + 60 * 60 * 1000);
  let end = parseToGCalDate(meetingData.meetingEndTime);
  if (!end || end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 45 * 60 * 1000);
  }

  const formatUtc = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const datesParam = `${formatUtc(start)}/${formatUtc(end)}`;

  const descDetails = `${cleanDescription.trim()}\n\nNextUp Task Tracker: https://www.rguedu.in/nextup/`;
  const location = meetingData.meetingLink || meetingData.location || 'Google Meet';

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: datesParam,
    details: descDetails,
    location,
  });

  if (meetingData.attendees && meetingData.attendees.length > 0) {
    const emails = meetingData.attendees
      .map((a) => a.email?.trim())
      .filter((e): e is string => Boolean(e && e.includes('@')));
    if (emails.length > 0) {
      params.set('add', emails.join(','));
    }
  }

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Downloads a standard RFC 5545 iCalendar (.ics) file for Outlook, Apple Calendar, or mobile devices.
 */
export function downloadIcsFile(
  title: string,
  meetingData: MeetingData,
  cleanDescription: string = ''
) {
  const cleanTitle = title.replace(/\[MEETING\]\s*/i, '').trim();
  const summary = cleanTitle ? `Meeting: ${cleanTitle}` : 'Scheduled Meeting';

  const start = meetingData.meetingTime ? new Date(meetingData.meetingTime) : new Date(Date.now() + 3600000);
  let end = meetingData.meetingEndTime ? new Date(meetingData.meetingEndTime) : new Date(start.getTime() + 45 * 60000);
  if (end.getTime() <= start.getTime()) {
    end = new Date(start.getTime() + 45 * 60000);
  }

  const formatIcs = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  };

  const now = new Date();
  const location = meetingData.meetingLink || meetingData.location || 'Google Meet';
  const description = `${cleanDescription}\n\nManaged via NextUp: https://www.rguedu.in/nextup/`.replace(/\n/g, '\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Rathinam Group//NextUp Task Tracker//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:nextup-meeting-${Date.now()}@rguedu.in`,
    `DTSTAMP:${formatIcs(now)}`,
    `DTSTART:${formatIcs(start)}`,
    `DTEND:${formatIcs(end)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Upcoming Meeting in 15 Minutes',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${cleanTitle.replace(/\s+/g, '_') || 'meeting'}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Formats date and time into a friendly string e.g. "Thu, 12 Nov 2026, 10:30 AM"
 */
export function formatMeetingDisplayTime(val?: string): string {
  if (!val) return 'Date & Time not specified';
  const clean = val.replace('Z', '').split('.')[0];
  const d = new Date(clean);
  if (isNaN(d.getTime())) return val;

  return d.toLocaleString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
