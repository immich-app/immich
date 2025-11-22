import { authManager } from '$lib/managers/auth-manager.svelte';
import { toISOYearMonthUTC } from '$lib/utils/timeline-util';
import { getTimeBucket } from '@immich/sdk';
import type { MonthGroup } from '../month-group.svelte';
import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineManagerOptions } from '../types';

export async function loadFromTimeBuckets(
  timelineManager: TimelineManager,
  monthGroup: MonthGroup,
  options: TimelineManagerOptions,
  signal: AbortSignal,
): Promise<void> {
  if (monthGroup.getFirstAsset()) {
    return;
  }

  const timeBucket = toISOYearMonthUTC(monthGroup.yearMonth);
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
    if (!albumAssets) {
      return;
    }
    for (const id of albumAssets.id) {
      timelineManager.albumAssets.add(id);
    }
  }

  const unprocessedAssets = monthGroup.addAssets(bucketResponse, true);
  if (unprocessedAssets.length > 0) {
    console.error(
      `Warning: getTimeBucket API returning assets not in requested month: ${monthGroup.yearMonth.month}, ${JSON.stringify(
        unprocessedAssets.map((unprocessed) => ({
          id: unprocessed.id,
          localDateTime: unprocessed.localDateTime,
        })),
      )}`,
    );
  }
}
