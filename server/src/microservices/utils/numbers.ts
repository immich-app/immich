export function isDecimalNumber(number_: number): boolean {
  return !Number.isNaN(number_) && Number.isFinite(number_);
}

/**
 * Check if `num` is a valid number and is between `start` and `end` (inclusive)
 */
export function isNumberInRange(number_: number, start: number, end: number): boolean {
  return isDecimalNumber(number_) && number_ >= start && number_ <= end;
}

export function toNumberOrNull(input: number | string | null | undefined): number | null {
  if (input === null || input === undefined) {
    return null;
  }

  const number_ = typeof input === 'string' ? Number.parseFloat(input) : input;
  return isDecimalNumber(number_) ? number_ : null;
}
