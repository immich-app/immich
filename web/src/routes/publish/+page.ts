import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllAlbums, getAllSharedLinksUnchecked, type AlbumResponseDto } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async () => {
  const sharedLinks = await getAllSharedLinksUnchecked();
  const sharedAlbums: AlbumResponseDto[] = sharedLinks
    .filter((link) => link.album)
    .map((link) => link.album!);
  const keys = sharedLinks.filter((link) => link.album).reduce((acc, link) => {
    acc[link.album!.id] = link.key
    return acc;
  }, {} as Record<string, string>)
  const $t = await getFormatter();

  return {
    sharedAlbums,
    keys,
    meta: {
      title: $t('albums'),
    },
  };
}) satisfies PageLoad;
