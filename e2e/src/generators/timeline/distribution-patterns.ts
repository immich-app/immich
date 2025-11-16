import { generateConsecutiveDays, generateDayAssets } from 'src/generators/timeline/model-objects';
import { SeededRandom, selectRandomDays } from 'src/generators/timeline/utils';
import type { MockTimelineAsset } from './timeline-config';
import { GENERATION_CONSTANTS } from './timeline-config';

type AssetDistributionStrategy = (rng: SeededRandom) => number;

type DayDistributionStrategy = (
  year: number,
  month: number,
  daysInMonth: number,
  totalAssets: number,
  ownerId: string,
  rng: SeededRandom,
) => MockTimelineAsset[];

/**
 * Strategies for determining total asset count per month
 */
export const ASSET_DISTRIBUTION: Record<MonthDistribution, AssetDistributionStrategy | null> = {
  empty: null, // Special case - handled separately
  sparse: (rng) => rng.nextInt(3, 9), // 3-8 assets
  medium: (rng) => rng.nextInt(15, 31), // 15-30 assets
  dense: (rng) => rng.nextInt(50, 81), // 50-80 assets
  'very-dense': (rng) => rng.nextInt(80, 151), // 80-150 assets
};

/**
 * Strategies for distributing assets across days within a month
 */
export const DAY_DISTRIBUTION: Record<DayPattern, DayDistributionStrategy> = {
  'single-day': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // All assets on one day in the middle of the month
    const day = Math.floor(daysInMonth / 2);
    return generateDayAssets(year, month, day, totalAssets, ownerId, rng);
  },

  'consecutive-large': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // 3-5 consecutive days with evenly distributed assets
    const numDays = Math.min(5, Math.floor(totalAssets / 15));
    const startDay = rng.nextInt(1, daysInMonth - numDays + 2);
    return generateConsecutiveDays(year, month, startDay, numDays, totalAssets, ownerId, rng);
  },

  'consecutive-small': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Multiple consecutive days with 1-3 assets each (side-by-side layout)
    const assets: MockTimelineAsset[] = [];
    const numDays = Math.min(totalAssets, Math.floor(daysInMonth / 2));
    const startDay = rng.nextInt(1, daysInMonth - numDays + 2);
    let assetIndex = 0;

    for (let i = 0; i < numDays && assetIndex < totalAssets; i++) {
      const dayAssets = Math.min(3, rng.nextInt(1, 4));
      const actualAssets = Math.min(dayAssets, totalAssets - assetIndex);
      // Create a new RNG for this day
      const dayRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, startDay + i, actualAssets, ownerId, dayRng));
      assetIndex += actualAssets;
    }
    return assets;
  },

  alternating: (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Alternate between large (15-25) and small (1-3) days
    const assets: MockTimelineAsset[] = [];
    let day = 1;
    let isLarge = true;
    let assetIndex = 0;

    while (assetIndex < totalAssets && day <= daysInMonth) {
      const dayAssets = isLarge ? Math.min(25, rng.nextInt(15, 26)) : rng.nextInt(1, 4);

      const actualAssets = Math.min(dayAssets, totalAssets - assetIndex);
      // Create a new RNG for this day
      const dayRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, day, actualAssets, ownerId, dayRng));
      assetIndex += actualAssets;

      day += isLarge ? 1 : 1; // Could add gaps here
      isLarge = !isLarge;
    }
    return assets;
  },

  'sparse-scattered': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Spread assets across random days with gaps
    const assets: MockTimelineAsset[] = [];
    const numDays = Math.min(totalAssets, Math.floor(daysInMonth * GENERATION_CONSTANTS.SPARSE_DAY_COVERAGE));
    const daysWithPhotos = selectRandomDays(daysInMonth, numDays, rng);
    let assetIndex = 0;

    for (let i = 0; i < daysWithPhotos.length && assetIndex < totalAssets; i++) {
      const dayAssets =
        Math.floor(totalAssets / numDays) + (i === daysWithPhotos.length - 1 ? totalAssets % numDays : 0);
      // Create a new RNG for this day
      const dayRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, daysWithPhotos[i], dayAssets, ownerId, dayRng));
      assetIndex += dayAssets;
    }
    return assets;
  },

  'start-heavy': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Most assets in first week
    const assets: MockTimelineAsset[] = [];
    const firstWeekAssets = Math.floor(totalAssets * 0.7);
    const remainingAssets = totalAssets - firstWeekAssets;

    // First 7 days
    assets.push(...generateConsecutiveDays(year, month, 1, 7, firstWeekAssets, ownerId, rng));

    // Remaining scattered
    if (remainingAssets > 0) {
      const midDay = Math.floor(daysInMonth / 2);
      // Create a new RNG for the remaining assets
      const remainingRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, midDay, remainingAssets, ownerId, remainingRng));
    }
    return assets;
  },

  'end-heavy': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Most assets in last week
    const assets: MockTimelineAsset[] = [];
    const lastWeekAssets = Math.floor(totalAssets * 0.7);
    const remainingAssets = totalAssets - lastWeekAssets;

    // Remaining at start
    if (remainingAssets > 0) {
      // Create a new RNG for the start assets
      const startRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, 2, remainingAssets, ownerId, startRng));
    }

    // Last 7 days
    const startDay = daysInMonth - 6;
    assets.push(...generateConsecutiveDays(year, month, startDay, 7, lastWeekAssets, ownerId, rng));
    return assets;
  },

  'mid-heavy': (year, month, daysInMonth, totalAssets, ownerId, rng) => {
    // Most assets in middle of month
    const assets: MockTimelineAsset[] = [];
    const midAssets = Math.floor(totalAssets * 0.7);
    const sideAssets = Math.floor((totalAssets - midAssets) / 2);

    // Start
    if (sideAssets > 0) {
      // Create a new RNG for the start assets
      const startRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, 2, sideAssets, ownerId, startRng));
    }

    // Middle
    const midStart = Math.floor(daysInMonth / 2) - 3;
    assets.push(...generateConsecutiveDays(year, month, midStart, 7, midAssets, ownerId, rng));

    // End
    const endAssets = totalAssets - midAssets - sideAssets;
    if (endAssets > 0) {
      // Create a new RNG for the end assets
      const endRng = new SeededRandom(rng.nextInt(0, 1_000_000));
      assets.push(...generateDayAssets(year, month, daysInMonth - 1, endAssets, ownerId, endRng));
    }
    return assets;
  },
};
export type MonthDistribution =
  | 'empty' // 0 assets
  | 'sparse' // 3-8 assets
  | 'medium' // 15-30 assets
  | 'dense' // 50-80 assets
  | 'very-dense'; // 80-150 assets

export type DayPattern =
  | 'single-day' // All images in one day
  | 'consecutive-large' // Multiple days with 15-25 images each
  | 'consecutive-small' // Multiple days with 1-3 images each (side-by-side)
  | 'alternating' // Alternating large/small days
  | 'sparse-scattered' // Few images scattered across month
  | 'start-heavy' // Most images at start of month
  | 'end-heavy' // Most images at end of month
  | 'mid-heavy'; // Most images in middle of month
