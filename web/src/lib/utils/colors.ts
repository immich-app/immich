export const hexToRgb = (hex: string): string | null => {
  const cleanHex = hex.replace(/^#/, '');
  if (!/^([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(cleanHex)) return null;

  const values =
    cleanHex.length === 3
      ? [...cleanHex].map((c) => parseInt(c + c, 16))
      : [0, 1, 2].map((i) => parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16));

  return `${values.join(' ')}`;
};
