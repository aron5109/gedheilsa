import { MOODS } from './mood';
import type { MoodEntry, Appointment } from './types';
// Neutralizes spreadsheet formulas even when preceded by whitespace or controls.
export function csvCell(value: unknown): string {
  let text = String(value ?? '');
  if (/^[\s\u0000-\u001f]*[=+@-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}
export function moodCsv(entries: MoodEntry[], includeNotes = false): string {
  return (
    '\uFEFF' +
    [
      [
        'Auðkenni',
        'Tími (ISO 8601)',
        'Líðan (1–5)',
        'Líðan',
        'Orka (1–5)',
        'Tilfinningar',
        ...(includeNotes ? ['Athugasemd'] : []),
      ],
      ...entries.map((e) => [
        e.id,
        e.occurred_at,
        e.score,
        MOODS[e.score - 1].label,
        e.energy,
        e.emotions.join(', '),
        ...(includeNotes ? [e.note] : []),
      ]),
    ]
      .map((row) => row.map(csvCell).join(';'))
      .join('\r\n') +
    '\r\n'
  );
}
export function icsEscape(value: string): string {
  return value
    .replaceAll('\\', '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replaceAll(';', '\\;')
    .replaceAll(',', '\\,');
}
function fold(line: string) {
  const parts: string[] = [];
  let chunk = '';
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) {
      parts.push(chunk);
      chunk = ' ';
      bytes = 1;
    }
    chunk += char;
    bytes += size;
  }
  parts.push(chunk);
  return parts.join('\r\n');
}
const utc = (value: string | Date) =>
  new Date(value)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
export function appointmentIcs(item: Appointment, includeDetails = false) {
  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hlyja//IS',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${item.id}@hlyja`,
      `DTSTAMP:${utc(item.created_at ?? item.starts_at)}`,
      `DTSTART:${utc(item.starts_at)}`,
      `DTEND:${utc(new Date(new Date(item.starts_at).getTime() + item.duration_minutes * 60000))}`,
      `SUMMARY:${icsEscape(includeDetails ? item.title : 'Frátekinn tími')}`,
      `LOCATION:${icsEscape(includeDetails ? item.location : '')}`,
      'CLASS:PRIVATE',
      'BEGIN:VALARM',
      `TRIGGER:-PT${item.reminder_minutes}M`,
      'ACTION:DISPLAY',
      'DESCRIPTION:Áminning um tíma',
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .map(fold)
      .join('\r\n') + '\r\n'
  );
}
export function googleCalendarUrl(item: Appointment, includeDetails = false) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: includeDetails ? item.title : 'Frátekinn tími',
    dates:
      utc(item.starts_at) +
      '/' +
      utc(new Date(new Date(item.starts_at).getTime() + item.duration_minutes * 60000)),
    location: includeDetails ? item.location : '',
  });
  return 'https://calendar.google.com/calendar/render?' + params;
}
