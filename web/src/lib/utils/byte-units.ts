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
export function getBytesWithUnit(bytes: number, maxPrecision = 1): [number, string] {
  const units = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB'];

  let magnitude = 0;
  let remainder = bytes;
  while (remainder >= 1024) {
    if (magnitude + 1 < units.length) {
      magnitude++;
      remainder /= 1024;
    } else {
      break;
    }
  }

  remainder = Number.parseFloat(remainder.toFixed(maxPrecision));

  return [remainder, units[magnitude]];
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
export function asByteUnitString(bytes: number, locale?: string, maxPrecision = 1): string {
  const [size, unit] = getBytesWithUnit(bytes, maxPrecision);
  return `${size.toLocaleString(locale)} ${unit}`;
}
