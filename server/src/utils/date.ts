export const asDateString = (x: Date | string | null): string | null => {
  return x instanceof Date ? x.toISOString().split('T')[0] : x;
};
