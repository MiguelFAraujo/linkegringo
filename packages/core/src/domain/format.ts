import type { DateRange, YearMonth } from './date-range.js';
import type { Profile } from './profile.js';

const MONTH_ABBREVIATIONS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function formatYearMonth(value: YearMonth): string {
  if (value.month === undefined) {
    return String(value.year);
  }
  const name = MONTH_ABBREVIATIONS[value.month - 1];
  return name === undefined ? String(value.year) : `${name} ${value.year}`;
}

export function formatDateRange(range: DateRange | undefined): string {
  if (range === undefined || (range.start === undefined && range.end === undefined)) {
    return '';
  }
  const start = range.start === undefined ? '' : formatYearMonth(range.start);
  const end = range.end === undefined ? 'Present' : formatYearMonth(range.end);
  return start === '' ? end : `${start} - ${end}`;
}

export function fullName(profile: Pick<Profile, 'firstName' | 'lastName'>): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}
