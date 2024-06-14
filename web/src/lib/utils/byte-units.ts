export enum ByteUnit {
  'B' = 0,
  'KiB' = 1,
  'MiB' = 2,
  'GiB' = 3,
  'TiB' = 4,
  'PiB' = 5,
  'EiB' = 6,
}

/**
 * Convert bytes to best human readable unit and number of that unit.
 *
 * * For `1024` bytes, returns `1` and `KiB`.
 * * For `1536` bytes, returns `1.5` and `KiB`.
 *
 * @param bytes number of bytes
 * @param maxPrecision maximum number of decimal places, default is `1`
 * @returns size (number) and unit (string)
 */
export function getBytesWithUnit(bytes: number, maxPrecision = 1): [number, ByteUnit] {
  const magnitude = Math.floor(Math.log(bytes === 0 ? 1 : bytes) / Math.log(1024));

  return [Number.parseFloat((bytes / 1024 ** magnitude).toFixed(maxPrecision)), magnitude];
}

/**
 * Localized number of bytes with a unit.
 *
 * For `1536` bytes:
 * * en: `1.5 KiB`
 * * de: `1,5 KiB`
 *
 * @param bytes number of bytes
 * @param maxPrecision maximum number of decimal places, default is `1`
 * @returns localized bytes with unit as string
 */
export function getByteUnitString(bytes: number, locale?: string, maxPrecision = 1): string {
  const [size, unit] = getBytesWithUnit(bytes, maxPrecision);
  return `${size.toLocaleString(locale)} ${ByteUnit[unit]}`;
}

/**
 * Convert to bytes from on a specified unit.
 *
 * * `1, 'GiB'`, returns `1073741824` bytes
 *
 * @param size value to be converted
 * @param unit unit to convert from
 * @returns bytes (number)
 */
export function convertToBytes(size: number, unit: ByteUnit): number {
  return size * 1024 ** unit;
}

/**
 * Convert from bytes to a specified unit.
 *
 * * `11073741824, 'GiB'`, returns `1` GiB
 *
 * @param bytes value to be converted
 * @param unit unit to convert to
 * @returns bytes (number)
 */
export function convertFromBytes(bytes: number, unit: ByteUnit): number {
  return bytes / 1024 ** unit;
}
