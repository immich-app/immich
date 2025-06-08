import { authManager } from '$lib/managers/auth-manager.svelte';
import { toISOYearMonthUTC } from '$lib/utils/timeline-util';
import { getTimeBucket } from '@immich/sdk';

import type { MonthGroup } from '../month-group.svelte';
import type { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineManagerOptions } from '../types';
import { layoutMonthGroup } from './layout-support.svelte';

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
  const key = authManager.key;
  const bucketResponse = await getTimeBucket(
    {
      ...options,
      timeBucket,
      key,
    },
    { signal },
  );
  if (bucketResponse) {
    if (options.timelineAlbumId) {
      const albumAssets = await getTimeBucket(
        {
          albumId: options.timelineAlbumId,
          timeBucket,
          key,
        },
        { signal },
      );
      for (const id of albumAssets.id) {
        timelineManager.albumAssets.add(id);
      }
    }
    const unprocessedAssets = monthGroup.addAssets(bucketResponse);
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
    layoutMonthGroup(timelineManager, monthGroup);
  }
}
