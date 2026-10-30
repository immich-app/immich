import type { TimelineAsset } from '#lib/managers/timeline-manager/types.ts';
import { toTimelineAsset } from '#lib/utils/timeline-util.ts';
import { factory as mockFactory } from '#test/medium/mock/factories.ts';

let timelineAssetIndex = 0;

const timelineAsset = (overrides: Partial<TimelineAsset> = {}): TimelineAsset => ({
  ...toTimelineAsset(mockFactory.asset()),
  ratio: 0.2 + (((timelineAssetIndex++ * 618_034) / 1_000_000) % 3.8),
  ...overrides,
});

export const factory = { ...mockFactory, timelineAsset };
