/** Icelandic output even in browsers whose ICU bundle omits the is-IS locale. */
const months = [
  'janúar',
  'febrúar',
  'mars',
  'apríl',
  'maí',
  'júní',
  'júlí',
  'ágúst',
  'september',
  'október',
  'nóvember',
  'desember',
];
const weekdays = [
  'sunnudagur',
  'mánudagur',
  'þriðjudagur',
  'miðvikudagur',
  'fimmtudagur',
  'föstudagur',
  'laugardagur',
];
const shortDays = ['sun.', 'mán.', 'þri.', 'mið.', 'fim.', 'fös.', 'lau.'];
const formatters = new Map<string, Intl.DateTimeFormat>();
export function calendarParts(value: Date | string, timeZone = 'Atlantic/Reykjavik') {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      numberingSystem: 'latn',
    });
    if (formatters.size >= 64) formatters.clear();
    formatters.set(timeZone, formatter);
  }
  const parts = formatter.formatToParts(new Date(value));
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)!.value;
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
  };
}
export function formatDate(
  value: Date | string,
  timeZone = 'Atlantic/Reykjavik',
  options: { weekday?: boolean; year?: boolean; time?: boolean } = {},
) {
  const p = calendarParts(value, timeZone);
  const weekday = new Date(`${p.year}-${p.month}-${p.day}T12:00:00Z`).getUTCDay();
  return `${options.weekday ? weekdays[weekday] + ', ' : ''}${Number(p.day)}. ${months[Number(p.month) - 1]}${options.year ? ' ' + p.year : ''}${options.time ? ' kl. ' + p.hour + ':' + p.minute : ''}`;
}
export function shortWeekday(isoDay: string) {
  return shortDays[new Date(isoDay + 'T12:00:00Z').getUTCDay()];
}
export function formatNumber(value: number, maximumFractionDigits = 1) {
  if (!Number.isFinite(value)) return '—';
  const [whole, fraction] = value.toFixed(maximumFractionDigits).split('.');
  const decimal = fraction?.replace(/0+$/, '');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + (decimal ? ',' + decimal : '');
}
export function isSingular(count: number) {
  return Math.abs(count) % 10 === 1 && Math.abs(count) % 100 !== 11;
}
export function registrationCount(count: number) {
  return `${formatNumber(count, 0)} ${isSingular(count) ? 'skráning' : 'skráningar'}`;
}
