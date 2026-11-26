import { authManager } from '#lib/managers/auth-manager.svelte.ts';
import { queryClient } from '#lib/queries/client.ts';
import { getTimeBucketQuery } from '#lib/queries/timeline.query.ts';
import { toISOYearMonthUTC } from '#lib/utils/timeline-util.ts';
import { TimelineManager } from '../timeline-manager.svelte';
import type { TimelineMonth } from '../timeline-month.svelte';
import type { TimelineManagerOptions } from '../types';

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
  const bucketResponse = await queryTimeBucket({ ...authManager.params, ...options, timeBucket }, signal);

  if (!bucketResponse || signal.aborted) {
    return;
  }

  if (options.timelineAlbumId) {
    const albumAssets = await queryTimeBucket(
      { ...authManager.params, albumId: options.timelineAlbumId, timeBucket },
      signal,
    );
    if (!albumAssets || signal.aborted) {
      return;
    }
    for (const id of albumAssets.id) {
      timelineManager.albumAssets.add(id);
    }
  }

  const unprocessedAssets = timelineMonth.addAssets(bucketResponse, true);
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

async function queryTimeBucket(params: Parameters<typeof getTimeBucketQuery>[0], signal: AbortSignal) {
  const query = getTimeBucketQuery(params);
  const cancel = () => void queryClient.cancelQueries({ queryKey: query.queryKey, exact: true });
  signal.addEventListener('abort', cancel);
  try {
    return await queryClient.query(query);
  } finally {
    signal.removeEventListener('abort', cancel);
  }
}
