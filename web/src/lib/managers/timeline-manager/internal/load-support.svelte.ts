import { authManager } from '$lib/managers/auth-manager.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import type { TimelineManagerOptions } from '$lib/managers/timeline-manager/types';
import { toISOYearMonthUTC } from '$lib/utils/timeline-util';
import { getTimeBucket } from '@immich/sdk';

export async function loadFromTimeBuckets(
  timelineManager: TimelineManager,
  month: TimelineMonth,
  options: TimelineManagerOptions,
  signal: AbortSignal,
): Promise<void> {
  if (month.getFirstAsset()) {
    return;
  }

  const timeBucket = toISOYearMonthUTC(month.yearMonth);
  const bucketResponse = await getTimeBucket(
    {
      ...authManager.params,
      ...options,
      timeBucket,
    },
    { signal },
  );

  if (!bucketResponse) {
    return;
  }

  if (options.timelineAlbumId) {
    const albumAssets = await getTimeBucket(
      {
        ...authManager.params,
        albumId: options.timelineAlbumId,
        timeBucket,
      },
      { signal },
    );
    for (const id of albumAssets.id) {
      timelineManager.albumAssets.add(id);
    }
  }

  const unprocessedAssets = month.addAssets(bucketResponse, true);
  if (unprocessedAssets.length > 0) {
    console.error(
      `Warning: getTimeBucket API returning assets not in requested month: ${month.yearMonth.month}, ${JSON.stringify(
        unprocessedAssets.map((unprocessed) => ({
          id: unprocessed.id,
          localDateTime: unprocessed.localDateTime,
        })),
      )}`,
    );
  }
}
