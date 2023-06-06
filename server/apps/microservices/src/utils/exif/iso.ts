import { isNumberInRange } from '../numbers';

export function parseISO(input: string): number | null {
  const values = input.split(',');

  for (const value of values) {
    const iso = Number.parseInt(value, 10);
    if (isNumberInRange(iso, 0, 2 ** 32)) {
      return iso;
    }
  }

  return null;
}
