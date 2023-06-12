export function isDecimalNumber(num: number): boolean {
  return !Number.isNaN(num) && Number.isFinite(num);
}

/**
 * Check if `num` is a valid number and is between `start` and `end` (inclusive)
 */
export function isNumberInRange(num: number, start: number, end: number): boolean {
  return isDecimalNumber(num) && num >= start && num <= end;
}

export function toNumberOrNull(input: number | string | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const num = typeof input === 'string' ? Number.parseFloat(input) : input;
  return isDecimalNumber(num) ? num : null;
}
