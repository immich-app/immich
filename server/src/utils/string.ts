export function nullIfEmpty(value: string): string | null;
export function nullIfEmpty(value: string | undefined): string | null | undefined;
export function nullIfEmpty(value: string | null | undefined): string | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (value === null || value === '') {
    return null;
  }

  return value;
}
