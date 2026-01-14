import type { AssetVisibility } from '@immich/sdk';
import { DayPattern, MonthDistribution } from 'src/generators/timeline/distribution-patterns';

// Constants for generation parameters
export const GENERATION_CONSTANTS = {
  VIDEO_PROBABILITY: 0.15, // 15% of assets are videos
  GPS_PERCENTAGE: 0.7, // 70% of assets have GPS data
  FAVORITE_PROBABILITY: 0.1, // 10% of assets are favorited
  MIN_VIDEO_DURATION_SECONDS: 5,
  MAX_VIDEO_DURATION_SECONDS: 300,
  DEFAULT_SEED: 12_345,
  DEFAULT_OWNER_ID: 'user-1',
  MAX_SELECT_ATTEMPTS: 10,
  SPARSE_DAY_COVERAGE: 0.4, // 40% of days have photos in sparse pattern
} as const;

// Aspect ratio distribution weights (must sum to 1)
export const ASPECT_RATIO_WEIGHTS = {
  '4:3': 0.35, // 35% 4:3 landscape
  '3:2': 0.25, // 25% 3:2 landscape
  '16:9': 0.2, // 20% 16:9 landscape
  '2:3': 0.1, // 10% 2:3 portrait
  '1:1': 0.09, // 9% 1:1 square
  '3:1': 0.01, // 1% 3:1 panorama
} as const;

export type AspectRatio = {
  width: number;
  height: number;
  ratio: number;
  name: string;
};

// Mock configuration for asset generation - will be transformed to API response formats
export type MockTimelineAsset = {
  id: string;
  ownerId: string;
  ratio: number;
  thumbhash: string | null;
  localDateTime: string;
  fileCreatedAt: string;
  isFavorite: boolean;
  isTrashed: boolean;
  isVideo: boolean;
  isImage: boolean;
  duration: string | null;
  projectionType: string | null;
  livePhotoVideoId: string | null;
  city: string | null;
  country: string | null;
  people: string[] | null;
  latitude: number | null;
  longitude: number | null;
  visibility: AssetVisibility;
  stack: null;
  checksum: string;
  fileSizeInByte: number;
};

export type MonthSpec = {
  year: number;
  month: number; // 1-12
  distribution: MonthDistribution;
  pattern: DayPattern;
};

/**
 * Configuration for timeline data generation
 */
export type TimelineConfig = {
  ownerId?: string;
  months: MonthSpec[];
  seed?: number;
  writeToFile?: boolean;
  outputPath?: string;
};

export type MockAlbum = {
  id: string;
  albumName: string;
  description: string;
  assetIds: string[]; // IDs of assets in the album
  thumbnailAssetId: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MockTimelineData = {
  buckets: Map<string, MockTimelineAsset[]>;
  album: MockAlbum; // Mock album created from random assets
};

export type SerializedTimelineData = {
  buckets: Record<string, MockTimelineAsset[]>;
  album: MockAlbum;
};

/**
 * Validates a TimelineConfig object to ensure all values are within expected ranges
 */
export function validateTimelineConfig(config: TimelineConfig): void {
  if (!config.months || config.months.length === 0) {
    throw new Error('TimelineConfig must contain at least one month');
  }

  const seenMonths = new Set<string>();

  for (const month of config.months) {
    if (month.month < 1 || month.month > 12) {
      throw new Error(`Invalid month: ${month.month}. Must be between 1 and 12`);
    }

    if (month.year < 1900 || month.year > 2100) {
      throw new Error(`Invalid year: ${month.year}. Must be between 1900 and 2100`);
    }

    const monthKey = `${month.year}-${month.month}`;
    if (seenMonths.has(monthKey)) {
      throw new Error(`Duplicate month found: ${monthKey}`);
    }
    seenMonths.add(monthKey);

    // Validate distribution if provided
    if (month.distribution && !['empty', 'sparse', 'medium', 'dense', 'very-dense'].includes(month.distribution)) {
      throw new Error(
        `Invalid distribution: ${month.distribution}. Must be one of: empty, sparse, medium, dense, very-dense`,
      );
    }

    const validPatterns = [
      'single-day',
      'consecutive-large',
      'consecutive-small',
      'alternating',
      'sparse-scattered',
      'start-heavy',
      'end-heavy',
      'mid-heavy',
    ];
    if (month.pattern && !validPatterns.includes(month.pattern)) {
      throw new Error(`Invalid pattern: ${month.pattern}. Must be one of: ${validPatterns.join(', ')}`);
    }
  }

  // Validate seed if provided
  if (config.seed !== undefined && (config.seed < 0 || !Number.isInteger(config.seed))) {
    throw new Error('Seed must be a non-negative integer');
  }

  // Validate ownerId if provided
  if (config.ownerId !== undefined && config.ownerId.trim() === '') {
    throw new Error('Owner ID cannot be an empty string');
  }
}

/**
 * Create a default timeline configuration
 */
export function createDefaultTimelineConfig(): TimelineConfig {
  const months: MonthSpec[] = [
    // 2024 - Mix of patterns
    { year: 2024, month: 12, distribution: 'very-dense', pattern: 'alternating' },
    { year: 2024, month: 11, distribution: 'dense', pattern: 'consecutive-large' },
    { year: 2024, month: 10, distribution: 'medium', pattern: 'mid-heavy' },
    { year: 2024, month: 9, distribution: 'sparse', pattern: 'consecutive-small' },
    { year: 2024, month: 8, distribution: 'empty', pattern: 'single-day' },
    { year: 2024, month: 7, distribution: 'dense', pattern: 'start-heavy' },
    { year: 2024, month: 6, distribution: 'medium', pattern: 'sparse-scattered' },
    { year: 2024, month: 5, distribution: 'sparse', pattern: 'single-day' },
    { year: 2024, month: 4, distribution: 'very-dense', pattern: 'consecutive-large' },
    { year: 2024, month: 3, distribution: 'empty', pattern: 'single-day' },
    { year: 2024, month: 2, distribution: 'medium', pattern: 'end-heavy' },
    { year: 2024, month: 1, distribution: 'dense', pattern: 'alternating' },

    // 2023 - Testing year boundaries and more patterns
    { year: 2023, month: 12, distribution: 'very-dense', pattern: 'end-heavy' },
    { year: 2023, month: 11, distribution: 'sparse', pattern: 'consecutive-small' },
    { year: 2023, month: 10, distribution: 'empty', pattern: 'single-day' },
    { year: 2023, month: 9, distribution: 'medium', pattern: 'alternating' },
    { year: 2023, month: 8, distribution: 'dense', pattern: 'mid-heavy' },
    { year: 2023, month: 7, distribution: 'sparse', pattern: 'sparse-scattered' },
    { year: 2023, month: 6, distribution: 'medium', pattern: 'consecutive-large' },
    { year: 2023, month: 5, distribution: 'empty', pattern: 'single-day' },
    { year: 2023, month: 4, distribution: 'sparse', pattern: 'single-day' },
    { year: 2023, month: 3, distribution: 'dense', pattern: 'start-heavy' },
    { year: 2023, month: 2, distribution: 'medium', pattern: 'alternating' },
    { year: 2023, month: 1, distribution: 'very-dense', pattern: 'consecutive-large' },
  ];

  for (let year = 2022; year >= 2000; year--) {
    for (let month = 12; month >= 1; month--) {
      months.push({ year, month, distribution: 'medium', pattern: 'sparse-scattered' });
    }
  }

  return {
    months,
    seed: 42,
  };
}
