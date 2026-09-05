import { describe, expect, it } from 'vitest';
import { formatDateRange, formatYearMonth, fullName } from './format.js';

describe('formatYearMonth', () => {
  it('renders month abbreviation and year when month is present', () => {
    expect(formatYearMonth({ year: 2020, month: 1 })).toBe('Jan 2020');
    expect(formatYearMonth({ year: 2021, month: 12 })).toBe('Dec 2021');
  });

  it('renders only the year when month is absent', () => {
    expect(formatYearMonth({ year: 2020 })).toBe('2020');
  });

  it('falls back to the year when the month is out of range', () => {
    expect(formatYearMonth({ year: 2020, month: 13 })).toBe('2020');
  });
});

describe('formatDateRange', () => {
  it('renders start and end when both are present', () => {
    expect(formatDateRange({ start: { year: 2020, month: 1 }, end: { year: 2021, month: 3 } })).toBe(
      'Jan 2020 - Mar 2021',
    );
  });

  it('renders "Present" when the end is absent but the start is present', () => {
    expect(formatDateRange({ start: { year: 2020, month: 1 } })).toBe('Jan 2020 - Present');
  });

  it('renders only the end when the start is absent', () => {
    expect(formatDateRange({ end: { year: 2021, month: 3 } })).toBe('Mar 2021');
  });

  it('renders years without months', () => {
    expect(formatDateRange({ start: { year: 2019 }, end: { year: 2021 } })).toBe('2019 - 2021');
  });

  it('returns an empty string when the range is undefined or empty', () => {
    expect(formatDateRange(undefined)).toBe('');
    expect(formatDateRange({})).toBe('');
  });
});

describe('fullName', () => {
  it('joins first and last name', () => {
    expect(fullName({ firstName: 'Joana', lastName: 'Exemplo' })).toBe('Joana Exemplo');
  });

  it('trims when the last name is empty', () => {
    expect(fullName({ firstName: 'Joana', lastName: '' })).toBe('Joana');
  });
});
