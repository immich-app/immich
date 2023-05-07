export function roundToDecimals(num: number, digits: number): number {
  const factor = 10 ** digits;
  return Math.round(num * factor + Number.EPSILON) / factor;
}
