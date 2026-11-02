import type { AssetResponseDto } from '@immich/sdk';
import { DateTime } from 'luxon';

export const yearMonthOf = (asset: AssetResponseDto) => {
  const date = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' });
  return `${date.year}-${date.month}`;
};

export const yearMonthsOf = (assets: AssetResponseDto[]) => [...new Set(assets.map((asset) => yearMonthOf(asset)))];

export const adjacentYearMonths = (yearMonth: string) => {
  const [year, month] = yearMonth.split('-', 2).map(Number);
  return [-1, 0, 1].map((offset) => {
    const date = DateTime.utc(year, month).plus({ months: offset });
    return `${date.year}-${date.month}`;
  });
};

const samePeriod = (a: DateTime, b: DateTime, unit: 'day' | 'month' | 'year') => {
  switch (unit) {
    case 'day': {
      return a.hasSame(b, 'day');
    }
    case 'month': {
      return a.hasSame(b, 'month');
    }
    default: {
      return a.hasSame(b, 'year');
    }
  }
};

export const adjacentAsset = (
  assets: AssetResponseDto[],
  asset: AssetResponseDto,
  direction: 'next' | 'previous',
  unit: 'day' | 'month' | 'year',
) => {
  const current = DateTime.fromISO(asset.fileCreatedAt, { zone: 'utc' });
  const index = assets.findIndex(({ id }) => id === asset.id);
  const step = direction === 'next' ? 1 : -1;
  for (let cursor = index + step; cursor >= 0 && cursor < assets.length; cursor += step) {
    const candidate = assets[cursor];
    if (!samePeriod(DateTime.fromISO(candidate.fileCreatedAt, { zone: 'utc' }), current, unit)) {
      return candidate;
    }
  }
};
