import { formatGroupTitle } from '$lib/utils/timeline-util';
import { DateTime } from 'luxon';

describe('formatGroupTitle', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-07-27T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  it('formats today', () => {
    const date = DateTime.fromISO('2024-07-27T01:00:00Z');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('today');
    expect(formatGroupTitle(date.setLocale('es'))).toBe('hoy');
  });

  it('formats yesterday', () => {
    const date = DateTime.fromISO('2024-07-26T23:59:59Z');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('yesterday');
    expect(formatGroupTitle(date.setLocale('fr'))).toBe('hier');
  });

  it('formats last week', () => {
    const date = DateTime.fromISO('2024-07-21T00:00:00Z');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('Sunday');
    expect(formatGroupTitle(date.setLocale('ar-SA'))).toBe('الأحد');
  });

  it('formats date 7 days ago', () => {
    const date = DateTime.fromISO('2024-07-20T00:00:00Z');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('Sat, Jul 20');
    expect(formatGroupTitle(date.setLocale('de'))).toBe('Sa., 20. Juli');
  });

  it('formats date this year', () => {
    const date = DateTime.fromISO('2020-01-01T00:00:00Z');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('Wed, Jan 1, 2020');
    expect(formatGroupTitle(date.setLocale('ja'))).toBe('2020年1月1日(水)');
  });

  it('returns "Invalid DateTime" when date is invalid', () => {
    const date = DateTime.invalid('test');
    expect(formatGroupTitle(date.setLocale('en'))).toBe('Invalid DateTime');
    expect(formatGroupTitle(date.setLocale('es'))).toBe('Invalid DateTime');
  });
});
