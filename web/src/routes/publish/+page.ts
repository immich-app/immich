import { getFormatter } from '$lib/utils/i18n';
import { getAllSharedLinksUnchecked, type AlbumResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  const sharedLinks = await getAllSharedLinksUnchecked();
  const sharedAlbums: AlbumResponseDto[] = sharedLinks
    .filter((link) => link.album)
    .map((link) => link.album!);

  const keys: Record<string, string> = {};
  for (const link of sharedLinks) {
    if (link.album) {
      keys[link.album.id] = link.key;
    }
  }
  const $t = await getFormatter();

  return {
    sharedAlbums,
    keys,
    meta: {
      title: $t('albums'),
    },
  };
}) satisfies PageLoad;
