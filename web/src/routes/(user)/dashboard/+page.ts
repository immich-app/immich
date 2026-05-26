import { getAllTags, getAssetStatistics, getAlbumStatistics, AssetVisibility } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const $t = await getFormatter();

  const [tags, timelineStats, favoriteStats, archiveStats, trashStats, albumStats] = await Promise.all([
    getAllTags(),
    getAssetStatistics({ visibility: AssetVisibility.Timeline }),
    getAssetStatistics({ isFavorite: true }),
    getAssetStatistics({ visibility: AssetVisibility.Archive }),
    getAssetStatistics({ isTrashed: true }),
    getAlbumStatistics(),
  ]);

  return {
    tags,
    stats: {
      timeline: timelineStats,
      favorites: favoriteStats,
      archive: archiveStats,
      trash: trashStats,
      albums: albumStats,
    },
    meta: {
      title: $t('dashboard'),
    },
  };
}) satisfies PageLoad;
