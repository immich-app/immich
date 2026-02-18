export { generateTimelineData } from './timeline/model-objects';

export { createDefaultTimelineConfig, validateTimelineConfig } from './timeline/timeline-config';

export type {
  MockAlbum,
  MonthSpec,
  SerializedTimelineData,
  MockTimelineAsset as TimelineAssetConfig,
  TimelineConfig,
  MockTimelineData as TimelineData,
} from './timeline/timeline-config';

export {
  getAlbum,
  getAsset,
  getTimeBucket,
  getTimeBuckets,
  toAssetResponseDto,
  toColumnarFormat,
} from './timeline/rest-response';

export type { Changes } from './timeline/rest-response';

export { randomImage, randomImageFromString, randomPreview, randomThumbnail } from './timeline/images';

export {
  SeededRandom,
  getMockAsset,
  parseTimeBucketKey,
  selectRandom,
  selectRandomDays,
  selectRandomMultiple,
} from './timeline/utils';

export { ASSET_DISTRIBUTION, DAY_DISTRIBUTION } from './timeline/distribution-patterns';
export type { DayPattern, MonthDistribution } from './timeline/distribution-patterns';
