import { locale } from '$lib/stores/preferences.store';
import { parseUtcDate } from '$lib/utils/date-time';
import { formatGroupTitle, weightedRandomSample } from '$lib/utils/timeline-util';
import { DateTime } from 'luxon';

describe('formatGroupTitle', () => {
  beforeAll(() => {
    vi.useFakeTimers();
    process.env.TZ = 'UTC';
    vi.setSystemTime(new Date('2024-07-27T12:00:00Z'));
  });

  afterAll(() => {
    vi.useRealTimers();
    delete process.env.TZ;
  });

  it('formats today', () => {
    const date = parseUtcDate('2024-07-27T01:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('today');
    locale.set('es');
    expect(formatGroupTitle(date)).toBe('hoy');
  });

  it('formats yesterday', () => {
    const date = parseUtcDate('2024-07-26T23:59:59Z');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('yesterday');
    locale.set('fr');
    expect(formatGroupTitle(date)).toBe('hier');
  });

  it('formats last week', () => {
    const date = parseUtcDate('2024-07-21T00:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('Sunday');
    locale.set('ar-SA');
    expect(formatGroupTitle(date)).toBe('الأحد');
  });

  it('formats date 7 days ago', () => {
    const date = parseUtcDate('2024-07-20T00:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('Sat, Jul 20');
    locale.set('de');
    expect(formatGroupTitle(date)).toBe('Sa., 20. Juli');
  });

  it('formats date this year', () => {
    const date = parseUtcDate('2020-01-01T00:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('Wed, Jan 1, 2020');
    locale.set('ja');
    expect(formatGroupTitle(date)).toBe('2020年1月1日(水)');
  });

  it('formats future date', () => {
    const tomorrow = parseUtcDate('2024-07-28T00:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(tomorrow)).toBe('Sun, Jul 28');

    const nextMonth = parseUtcDate('2024-08-28T00:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(nextMonth)).toBe('Wed, Aug 28');

    const nextYear = parseUtcDate('2025-01-10T12:00:00Z');
    locale.set('en');
    expect(formatGroupTitle(nextYear)).toBe('Fri, Jan 10, 2025');
  });

  it('returns "Invalid DateTime" when date is invalid', () => {
    const date = DateTime.invalid('test');
    locale.set('en');
    expect(formatGroupTitle(date)).toBe('Invalid DateTime');
    locale.set('es');
    expect(formatGroupTitle(date)).toBe('Invalid DateTime');
  });
});

describe('randomSample', () => {
  it('always returns a valid index', () => {
    const n = 240;
    const data: number[] = [...Array(n).keys()].map(() => Math.random());

    for (let i = 0; i < 100; i++) {
      const idx = weightedRandomSample(data);
      expect(idx).toBeDefined();
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(n);
      expect(idx % 1).toBe(0); // index must be a whole number
    }
  });

  it('handles empty inputs', () => {
    const idx = weightedRandomSample([]);
    expect(idx).toBeUndefined();
  });

  it('does not select zero-weight elements', () => {
    const data = [0, 0, 2, 0];

    for (let i = 0; i < 100; i++) {
      const idx = weightedRandomSample(data);
      expect(idx).toBe(2);
    }
  });

  it('handles all zero weight lists', () => {
    const idx = weightedRandomSample([0, 0, 0, 0]);
    expect(idx).toBeUndefined();
  });
});
