import { authManager } from '$lib/managers/auth-manager.svelte';
import { toISOYearMonthUTC } from '$lib/utils/timeline-util';
import { getTimeBucket } from '@immich/sdk';
import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineMonth } from '../timeline-month.svelte';
import type { TimelineManagerOptions } from '../types';
import { getTimelineAlbumQueryOptions, mergeTimeBucketAssets } from './album-picker-support';

export async function loadFromTimeBuckets(
  timelineManager: TimelineManager,
  timelineMonth: TimelineMonth,
  options: TimelineManagerOptions,
  signal: AbortSignal,
): Promise<void> {
  if (timelineMonth.getFirstAsset()) {
    return;
  }

  const timeBucket = toISOYearMonthUTC(timelineMonth.yearMonth);
  const albumQueryOptions = getTimelineAlbumQueryOptions(options);
  const bucketResponse = await getTimeBucket(
    {
      ...authManager.params,
      ...options,
      timeBucket,
    },
    { signal },
  );

  if (!bucketResponse || signal.aborted) {
    return;
  }

  let mergedBucketResponse = bucketResponse;
  let isMergedBucket = false;

  if (albumQueryOptions) {
    const albumAssets = await getTimeBucket(
      {
        ...authManager.params,
        ...albumQueryOptions,
        timeBucket,
      },
      { signal },
    );
    if (!albumAssets || signal.aborted) {
      return;
    }
    for (const id of albumAssets.id) {
      timelineManager.albumAssets.add(id);
    }
    if (albumAssets.id.length > 0) {
      mergedBucketResponse = mergeTimeBucketAssets(bucketResponse, albumAssets);
      isMergedBucket = mergedBucketResponse.id.length !== bucketResponse.id.length;
    }
  }

  if (options.timelineSpaceId) {
    const spaceAssets = await getTimeBucket(
      {
        ...authManager.params,
        spaceId: options.timelineSpaceId,
        timeBucket,
      },
      { signal },
    );
    if (!spaceAssets) {
      return;
    }
    for (const id of spaceAssets.id) {
      timelineManager.albumAssets.add(id);
    }
  }

  const unprocessedAssets = timelineMonth.addAssets(mergedBucketResponse, !isMergedBucket);
  if (unprocessedAssets.length > 0) {
    console.error(
      `Warning: getTimeBucket API returning assets not in requested month: ${timelineMonth.yearMonth.month}, ${JSON.stringify(
        unprocessedAssets.map((unprocessed) => ({
          id: unprocessed.id,
          localDateTime: unprocessed.localDateTime,
        })),
      )}`,
    );
  }
}
