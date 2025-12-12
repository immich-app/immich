/**
 * Generator functions for timeline model objects
 */

import { faker } from '@faker-js/faker';
import { AssetVisibility } from '@immich/sdk';
import { DateTime } from 'luxon';
import { writeFileSync } from 'node:fs';
import { SeededRandom } from 'src/generators/timeline/utils';
import type { DayPattern, MonthDistribution } from './distribution-patterns';
import { ASSET_DISTRIBUTION, DAY_DISTRIBUTION } from './distribution-patterns';
import type { MockTimelineAsset, MockTimelineData, SerializedTimelineData, TimelineConfig } from './timeline-config';
import { ASPECT_RATIO_WEIGHTS, GENERATION_CONSTANTS, validateTimelineConfig } from './timeline-config';

/**
 * Generate a random aspect ratio based on weighted probabilities
 */
export function generateAspectRatio(rng: SeededRandom): string {
  const random = rng.next();
  let cumulative = 0;

  for (const [ratio, weight] of Object.entries(ASPECT_RATIO_WEIGHTS)) {
    cumulative += weight;
    if (random < cumulative) {
      return ratio;
    }
  }
  return '16:9'; // Default fallback
}

export function generateThumbhash(rng: SeededRandom): string {
  return Array.from({ length: 10 }, () => rng.nextInt(0, 256).toString(16).padStart(2, '0')).join('');
}

export function generateDuration(rng: SeededRandom): string {
  return `${rng.nextInt(GENERATION_CONSTANTS.MIN_VIDEO_DURATION_SECONDS, GENERATION_CONSTANTS.MAX_VIDEO_DURATION_SECONDS)}.${rng.nextInt(0, 1000).toString().padStart(3, '0')}`;
}

export function generateUUID(): string {
  return faker.string.uuid();
}

export function generateAsset(
  year: number,
  month: number,
  day: number,
  ownerId: string,
  rng: SeededRandom,
): MockTimelineAsset {
  const from = DateTime.fromObject({ year, month, day }).setZone('UTC');
  const to = from.endOf('day');
  const date = faker.date.between({ from: from.toJSDate(), to: to.toJSDate() });
  const isVideo = rng.next() < GENERATION_CONSTANTS.VIDEO_PROBABILITY;

  const assetId = generateUUID();
  const hasGPS = rng.next() < GENERATION_CONSTANTS.GPS_PERCENTAGE;

  const ratio = generateAspectRatio(rng);

  const asset: MockTimelineAsset = {
    id: assetId,
    ownerId,
    ratio: Number.parseFloat(ratio.split(':')[0]) / Number.parseFloat(ratio.split(':')[1]),
    thumbhash: generateThumbhash(rng),
    localDateTime: date.toISOString(),
    fileCreatedAt: date.toISOString(),
    isFavorite: rng.next() < GENERATION_CONSTANTS.FAVORITE_PROBABILITY,
    isTrashed: false,
    isVideo,
    isImage: !isVideo,
    duration: isVideo ? generateDuration(rng) : null,
    projectionType: null,
    livePhotoVideoId: null,
    city: hasGPS ? faker.location.city() : null,
    country: hasGPS ? faker.location.country() : null,
    people: null,
    latitude: hasGPS ? faker.location.latitude() : null,
    longitude: hasGPS ? faker.location.longitude() : null,
    visibility: AssetVisibility.Timeline,
    stack: null,
    fileSizeInByte: faker.number.int({ min: 510, max: 5_000_000 }),
    checksum: faker.string.alphanumeric({ length: 5 }),
  };

  return asset;
}

/**
 * Generate assets for a specific day
 */
export function generateDayAssets(
  year: number,
  month: number,
  day: number,
  assetCount: number,
  ownerId: string,
  rng: SeededRandom,
): MockTimelineAsset[] {
  return Array.from({ length: assetCount }, () => generateAsset(year, month, day, ownerId, rng));
}

/**
 * Distribute assets evenly across consecutive days
 *
 * @returns Array of generated timeline assets
 */
export function generateConsecutiveDays(
  year: number,
  month: number,
  startDay: number,
  numDays: number,
  totalAssets: number,
  ownerId: string,
  rng: SeededRandom,
): MockTimelineAsset[] {
  const assets: MockTimelineAsset[] = [];
  const assetsPerDay = Math.floor(totalAssets / numDays);

  for (let i = 0; i < numDays; i++) {
    const dayAssets =
      i === numDays - 1
        ? totalAssets - assetsPerDay * (numDays - 1) // Remainder on last day
        : assetsPerDay;
    // Create a new RNG with a different seed for each day
    const dayRng = new SeededRandom(rng.nextInt(0, 1_000_000) + i * 100);
    assets.push(...generateDayAssets(year, month, startDay + i, dayAssets, ownerId, dayRng));
  }

  return assets;
}

/**
 * Generate assets for a month with specified distribution pattern
 */
export function generateMonthAssets(
  year: number,
  month: number,
  ownerId: string,
  distribution: MonthDistribution = 'medium',
  pattern: DayPattern = 'consecutive-large',
  rng: SeededRandom,
): MockTimelineAsset[] {
  const daysInMonth = new Date(year, month, 0).getDate();

  if (distribution === 'empty') {
    return [];
  }

  const distributionStrategy = ASSET_DISTRIBUTION[distribution];
  if (!distributionStrategy) {
    console.warn(`Unknown distribution: ${distribution}, defaulting to medium`);
    return [];
  }
  const totalAssets = distributionStrategy(rng);

  const dayStrategy = DAY_DISTRIBUTION[pattern];
  if (!dayStrategy) {
    console.warn(`Unknown pattern: ${pattern}, defaulting to consecutive-large`);
    // Fallback to consecutive-large pattern
    const numDays = Math.min(5, Math.floor(totalAssets / 15));
    const startDay = rng.nextInt(1, daysInMonth - numDays + 2);
    const assets = generateConsecutiveDays(year, month, startDay, numDays, totalAssets, ownerId, rng);
    assets.sort((a, b) => DateTime.fromISO(b.localDateTime).diff(DateTime.fromISO(a.localDateTime)).milliseconds);
    return assets;
  }

  const assets = dayStrategy(year, month, daysInMonth, totalAssets, ownerId, rng);
  assets.sort((a, b) => DateTime.fromISO(b.localDateTime).diff(DateTime.fromISO(a.localDateTime)).milliseconds);
  return assets;
}

/**
 * Main generator function for timeline data
 */
export function generateTimelineData(config: TimelineConfig): MockTimelineData {
  validateTimelineConfig(config);

  const buckets = new Map<string, MockTimelineAsset[]>();
  const monthStats: Record<string, { count: number; distribution: MonthDistribution; pattern: DayPattern }> = {};

  const globalRng = new SeededRandom(config.seed || GENERATION_CONSTANTS.DEFAULT_SEED);
  faker.seed(globalRng.nextInt(0, 1_000_000));
  for (const monthConfig of config.months) {
    const { year, month, distribution, pattern } = monthConfig;

    const monthSeed = globalRng.nextInt(0, 1_000_000);
    const monthRng = new SeededRandom(monthSeed);

    const monthAssets = generateMonthAssets(
      year,
      month,
      config.ownerId || generateUUID(),
      distribution,
      pattern,
      monthRng,
    );

    if (monthAssets.length > 0) {
      const monthKey = `${year}-${month.toString().padStart(2, '0')}`;
      monthStats[monthKey] = {
        count: monthAssets.length,
        distribution,
        pattern,
      };

      // Create bucket key (YYYY-MM-01)
      const bucketKey = `${year}-${month.toString().padStart(2, '0')}-01`;
      buckets.set(bucketKey, monthAssets);
    }
  }

  // Create a mock album from random assets
  const allAssets = [...buckets.values()].flat();

  // Select 10-30 random assets for the album (or all assets if less than 10)
  const albumSize = Math.min(allAssets.length, globalRng.nextInt(10, 31));
  const selectedAssetConfigs: MockTimelineAsset[] = [];
  const usedIndices = new Set<number>();

  while (selectedAssetConfigs.length < albumSize && usedIndices.size < allAssets.length) {
    const randomIndex = globalRng.nextInt(0, allAssets.length);
    if (!usedIndices.has(randomIndex)) {
      usedIndices.add(randomIndex);
      selectedAssetConfigs.push(allAssets[randomIndex]);
    }
  }

  // Sort selected assets by date (newest first)
  selectedAssetConfigs.sort(
    (a, b) => DateTime.fromISO(b.localDateTime).diff(DateTime.fromISO(a.localDateTime)).milliseconds,
  );

  const selectedAssets = selectedAssetConfigs.map((asset) => asset.id);

  const now = new Date().toISOString();
  const album = {
    id: generateUUID(),
    albumName: 'Test Album',
    description: 'A mock album for testing',
    assetIds: selectedAssets,
    thumbnailAssetId: selectedAssets.length > 0 ? selectedAssets[0] : null,
    createdAt: now,
    updatedAt: now,
  };

  // Write to file if configured
  if (config.writeToFile) {
    const outputPath = config.outputPath || '/tmp/timeline-data.json';

    // Convert Map to object for serialization
    const serializedData: SerializedTimelineData = {
      buckets: Object.fromEntries(buckets),
      album,
    };

    try {
      writeFileSync(outputPath, JSON.stringify(serializedData, null, 2));
      console.log(`Timeline data written to ${outputPath}`);
    } catch (error) {
      console.error(`Failed to write timeline data to ${outputPath}:`, error);
    }
  }

  return { buckets, album };
}
