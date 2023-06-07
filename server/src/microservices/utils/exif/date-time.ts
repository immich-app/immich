import { ExifDateTime } from 'exiftool-vendored';
import { isDecimalNumber } from '../numbers';

export function exifToDate(exifDate: string | Date | ExifDateTime | undefined): Date | null {
  if (!exifDate) {
    return null;
  }

  const date = exifDate instanceof ExifDateTime ? exifDate.toDate() : new Date(exifDate);
  if (!isDecimalNumber(date.valueOf())) {
    return null;
  }

  return date;
}

export function exifTimeZone(exifDate: string | Date | ExifDateTime | undefined): string | null {
  const isExifDate = exifDate instanceof ExifDateTime;
  if (!isExifDate) {
    return null;
  }

  return exifDate.zone ?? null;
}
