import type { AssetResponseDto } from '@immich/sdk';

const minimalMp4Base64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAMobW9vdgAAAGxtdmhkAAAAAAAAAAAA' +
  'AAAAAAAD6AAAJxAAAQAAAQAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAA' +
  'AABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAAAnd0cmFrAAAAXHRraGQAAAADAAAA' +
  'AAAAAAAAAAABAAAAAAAAJxAAAAAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAABAAAAAAAA' +
  'AAAAAAAAAABAAAAAABAAAAAQAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAAAAEAACcQAAAAAAABAAAA' +
  'AAHvbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAABAAAACgABVxAAAAAAALWhkbHIAAAAAAAAAAHZp' +
  'ZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABmm1pbmYAAAAUdm1oZAAAAAEAAAAAAAAAAAAA' +
  'ACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAVpzdGJsAAAAunN0c2QAAAAAAAAA' +
  'AQAAAKphdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAABAAEABIAAAASAAAAAAAAAABDExhdmMg' +
  'bGlieDI2NAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMGF2Y0MBQsAK/+EAF2dCwAqmEXsBEAAA' +
  'AwAQAAADACDxImEYAQAGaMhCDyyAAAAAEHBhc3AAAAABAAAAAQAAABRidHJ0AAAAAAAAAFYAAABW' +
  'AAAAGHN0dHMAAAAAAAAAAQAAAAoAAEAAAAAAFHN0c3MAAAAAAAAAAQAAAAEAAAAcc3RzYwAAAAAA' +
  'AAABAAAAAQAAAAoAAAABAAAAPHN0c3oAAAAAAAAAAAAAAAoAAAASAAAACgAAAAoAAAAKAAAACgAA' +
  'AAoAAAAKAAAACgAAAAoAAAAKAAAAFHN0Y28AAAAAAAAAAQAAA1gAAAA9dWR0YQAAADVtZXRhAAAA' +
  'AAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAAhpbHN0AAAACGZyZWUAAAB0bWRh' +
  'dAAAAA5liIIC////h6KAAKvPwAAAAAZBmhwF/UAAAAAGQZoqAX9QAAAABkGaOwF/UAAAAAZBmkkA' +
  'X9QAAAAGQZpZQF/UAAAABkGaaYBf1AAAAAZBmnnAX9QAAAAGQZqIgBb1AAAABkGamJAV9Q==';
export const fromBase64 = (value: string): Uint8Array<ArrayBuffer> =>
  Uint8Array.from(atob(value), (char) => char.codePointAt(0)!);

export const minimalMp4 = fromBase64(minimalMp4Base64);

export const opaquePng = fromBase64(
  'iVBORw0KGgoAAAANSUhEUgAAAAgAAAAICAIAAABLbSncAAAAEUlEQVR4nGNwWJCAFTEMLQkAOplQAZmc5EIAAAAASUVORK5CYII=',
);

export const emptyMapStyle = { version: 8, sources: {}, layers: [] };
export const emptyMapStyleUrl = `data:application/json,${JSON.stringify(emptyMapStyle)}`;

export const placeholderImage = (asset: AssetResponseDto | undefined, id: string) => {
  const width = asset?.width ?? 1200;
  const height = asset?.height ?? 800;
  const fontSize = Math.round(Math.min(width, height) / 12);
  const label = asset?.originalFileName ?? id;
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<rect width="100%" height="100%" fill="hsl(${hueOf(id)} 60% 70%)"/>`,
    `<text x="50%" y="50%" font-family="sans-serif" font-size="${fontSize}" text-anchor="middle" dominant-baseline="middle" fill="#222">${label}</text>`,
    '</svg>',
  ].join('');
};

const hueOf = (value: string) => {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  }
  return hash;
};

export class SeededRandom {
  constructor(private seed: number) {}

  pickMany<T>(items: readonly T[], count: number): T[] {
    if (count > items.length) {
      throw new Error(`Cannot pick ${count} items from a list of ${items.length}`);
    }
    const indexes = new Set<number>();
    while (indexes.size < count) {
      indexes.add(this.nextInt(0, items.length));
    }
    return [...indexes].map((index) => items[index]);
  }

  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  next() {
    this.seed = (this.seed * 1_664_525 + 1_013_904_223) % 2_147_483_647;
    return this.seed / 2_147_483_647;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty list');
    }
    return items[this.nextInt(0, items.length)];
  }
}
