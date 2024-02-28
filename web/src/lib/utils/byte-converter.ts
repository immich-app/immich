/**
 * Convert to bytes from on a specified unit.
 *
 * * `1, 'GiB'`, returns `1073741824` bytes
 *
 * @param size value to be converted
 * @param unit unit to convert from
 * @returns bytes (number)
 */
export function convertToBytes(size: number, unit: string): number {
  let bytes = 0;

  if (unit === 'GiB') {
    bytes = size * 1_073_741_824;
  }

  return bytes;
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
export function convertFromBytes(bytes: number, unit: string): number {
  let size = 0;

  if (unit === 'GiB') {
    size = bytes / 1_073_741_824;
  }

  return size;
}
