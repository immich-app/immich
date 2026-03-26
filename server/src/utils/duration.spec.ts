import { formatSecondsToDuration, parseDurationToSeconds } from 'src/utils/duration';
import { describe, expect, it } from 'vitest';

describe('parseDurationToSeconds', () => {
  it('should parse HH:MM:SS.ffffff format', () => {
    expect(parseDurationToSeconds('0:05:23.456789')).toBeCloseTo(323.456_789);
  });

  it('should parse H:MM:SS format without fractional seconds', () => {
    expect(parseDurationToSeconds('1:23:45')).toBe(5025);
  });

  it('should parse 0:00:00.000000', () => {
    expect(parseDurationToSeconds('0:00:00.000000')).toBe(0);
  });

  it('should return null for null input', () => {
    expect(parseDurationToSeconds(null)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(parseDurationToSeconds('')).toBeNull();
  });
});

describe('formatSecondsToDuration', () => {
  it('should format seconds to ISO HH:MM:SS.ffffff format', () => {
    expect(formatSecondsToDuration(323.456_789)).toBe('00:05:23.456789');
  });

  it('should format zero', () => {
    expect(formatSecondsToDuration(0)).toBe('00:00:00.000000');
  });

  it('should format hours with zero-padding', () => {
    expect(formatSecondsToDuration(5025)).toBe('01:23:45.000000');
  });

  it('should produce a duration parseable by luxon Duration.fromISOTime', () => {
    // This is critical: the thumbnail display uses Duration.fromISOTime()
    // which requires HH:MM:SS format (not H:MM:SS)
    const formatted = formatSecondsToDuration(65.5);
    expect(formatted).toBe('00:01:05.500000');
    expect(formatted).toMatch(/^\d{2}:\d{2}:\d{2}\.\d+$/);
  });

  it('should roundtrip with parseDurationToSeconds', () => {
    const original = 185.75;
    const formatted = formatSecondsToDuration(original);
    const parsed = parseDurationToSeconds(formatted);
    expect(parsed).toBeCloseTo(original);
  });
});
