import { describe, expect, it } from '@jest/globals';
import { ExifDateTime } from 'exiftool-vendored';
import { exifTimeZone, exifToDate } from './date-time';

describe('converts exif date to JS date', () => {
  it('returns null for invalid inputs', () => {
    expect(exifToDate(undefined)).toBeNull();
    expect(exifToDate('invalid')).toBeNull();
    expect(exifToDate(new Date('invalid'))).toBeNull();
    expect(exifToDate(ExifDateTime.fromEXIF('invalid'))).toBeNull();
  });

  it('returns a valid date object for valid inputs', () => {
    const date = new Date('2023');
    expect(exifToDate(date)).toBeInstanceOf(Date);
    expect(exifToDate(date)?.toISOString()).toBe('2023-01-01T00:00:00.000Z');
    expect(exifToDate('2023')).toBeInstanceOf(Date);

    const exifDateTime = ExifDateTime.fromISO('2023-01-01T00:00:00.000Z');
    expect(exifToDate(exifDateTime)).toBeInstanceOf(Date);
    expect(exifToDate(exifDateTime)?.toISOString()).toBe('2023-01-01T00:00:00.000Z');
  });
});

describe('extracts the timezone from a date', () => {
  it('returns null for invalid inputs', () => {
    expect(exifTimeZone(undefined)).toBeNull();
    expect(exifTimeZone('')).toBeNull();
    expect(exifTimeZone(new Date('2023'))).toBeNull();
    expect(exifTimeZone(ExifDateTime.fromEXIF('invalid'))).toBeNull();
  });

  it('returns the timezone for valid inputs', () => {
    expect(exifTimeZone(ExifDateTime.fromEXIF('2020:12:29 14:24:45.700-05:00'))).toBe('UTC-5');
  });
});
