import type { AssetResponseDto } from '@immich/sdk';
import { expect } from '@playwright/test';

type Entry<T> = { value: T; seen: boolean; expected: boolean };

const minimalMp4Base64 =
  'AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAr9tZGF0AAACoAYF//+c' +
  '3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDEyNSAtIEguMjY0L01QRUctNCBBVkMgY29kZWMg' +
  'LSBDb3B5bGVmdCAyMDAzLTIwMTIgLSBodHRwOi8vd3d3LnZpZGVvbGFuLm9yZy94MjY0Lmh0bWwg' +
  'LSBvcHRpb25zOiBjYWJhYz0xIHJlZj0zIGRlYmxvY2s9MTowOjAgYW5hbHlzZT0weDM6MHgxMTMg' +
  'bWU9aGV4IHN1Ym1lPTcgcHN5PTEgcHN5X3JkPTEuMDA6MC4wMCBtaXhlZF9yZWY9MSBtZV9yYW5n' +
  'ZT0xNiBjaHJvbWFfbWU9MSB0cmVsbGlzPTEgOHg4ZGN0PTEgY3FtPTAgZGVhZHpvbmU9MjEsMTEg' +
  'ZmFzdF9wc2tpcD0xIGNocm9tYV9xcF9vZmZzZXQ9LTIgdGhyZWFkcz02IGxvb2thaGVhZF90aHJl' +
  'YWRzPTEgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJh' +
  'eV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2Fk' +
  'YXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtl' +
  'eWludD0yNTAga2V5aW50X21pbj0yNCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9v' +
  'a2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBt' +
  'YXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAV/0TAAYdeBTX' +
  'zg8AAALvbW9vdgAAAGxtdmhkAAAAAAAAAAAAAAAAAAAD6AAAACoAAQAAAQAAAAAAAAAAAAAAAAEAAAAA' +
  'AAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAgAA' +
  'Ahl0cmFrAAAAXHRraGQAAAAPAAAAAAAAAAAAAAABAAAAAAAAACoAAAAAAAAAAAAAAAAAAAAAAAEAAAAA' +
  'AAAAAAAAAAAAAAABAAAAAAAAAAAAAAAAAABAAAAAAAgAAAAIAAAAAAAkZWR0cwAAABxlbHN0AAAAAAAA' +
  'AAEAAAAqAAAAAAABAAAAAAGRbWRpYQAAACBtZGhkAAAAAAAAAAAAAAAAAAAwAAAAAgBVxAAAAAAA' +
  'LWhkbHIAAAAAAAAAAHZpZGUAAAAAAAAAAAAAAABWaWRlb0hhbmRsZXIAAAABPG1pbmYAAAAUdm1oZAAA' +
  'AAEAAAAAAAAAAAAAACRkaW5mAAAAHGRyZWYAAAAAAAAAAQAAAAx1cmwgAAAAAQAAAPxzdGJsAAAAmHN0' +
  'c2QAAAAAAAAAAQAAAIhhdmMxAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAgACABIAAAASAAAAAAAAAAB' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAGP//AAAAMmF2Y0MBZAAK/+EAGWdkAAqs' +
  '2V+WXAWyAAADAAIAAAMAYB4kSywBAAZo6+PLIsAAAAAYc3R0cwAAAAAAAAABAAAAAQAAAgAAAAAcc3Rz' +
  'YwAAAAAAAAABAAAAAQAAAAEAAAABAAAAFHN0c3oAAAAAAAACtwAAAAEAAAAUc3RjbwAAAAAAAAABAAAA' +
  'MAAAAGJ1ZHRhAAAAWm1ldGEAAAAAAAAAIWhkbHIAAAAAAAAAAG1kaXJhcHBsAAAAAAAAAAAAAAAALWls' +
  'c3QAAAAlqXRvbwAAAB1kYXRhAAAAAQAAAABMYXZmNTQuNjMuMTA0';
export const minimalMp4 = Buffer.from(minimalMp4Base64, 'base64');

const hueOf = (value: string) => {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + (char.codePointAt(0) ?? 0)) % 360;
  }
  return hash;
};

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

export class Spy<TCall, TExpected = TCall> {
  private readonly entries: Entry<TCall>[] = [];

  constructor(readonly name: string) {}

  get calls(): ReadonlyArray<TCall> {
    return this.entries.map((entry) => entry.value);
  }

  record(value: TCall, { expected = false } = {}) {
    this.entries.push({ value, seen: false, expected });
  }

  matches(value: TCall, expected: TExpected) {
    try {
      expect(value as unknown).toEqual(expected);
      return true;
    } catch {
      return false;
    }
  }

  markSeen(value: TCall) {
    for (const entry of this.entries) {
      if (entry.value === value) {
        entry.seen = true;
      }
    }
  }

  unexpected() {
    return this.entries.filter((entry) => entry.expected && !entry.seen).map((entry) => entry.value);
  }
}

export class SeededRandom {
  constructor(private seed: number) {}

  next() {
    this.seed = (this.seed * 1_664_525 + 1_013_904_223) % 2_147_483_647;
    return this.seed / 2_147_483_647;
  }

  nextInt(min: number, max: number) {
    return Math.floor(this.next() * (max - min)) + min;
  }

  pick<T>(items: readonly T[]): T {
    if (items.length === 0) {
      throw new Error('Cannot pick from an empty list');
    }
    return items[this.nextInt(0, items.length)];
  }

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
}
