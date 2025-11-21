import { authenticate } from '$lib/utils/auth';
import { getAssetInfoFromParam } from '$lib/utils/navigation';
import { getAlbumInfo, getEventInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => {
  await authenticate(url);
  const eventIdFromQuery = url.searchParams.get('eventId') || undefined;
  const albumPromise = getAlbumInfo({ id: params.albumId, withoutAssets: true });
  const assetPromise = getAssetInfoFromParam(params);

  const album = await albumPromise;
  const resolvedEventId = eventIdFromQuery ?? album.eventId ?? undefined;
  const eventPromise = resolvedEventId
    ? getEventInfo({ id: resolvedEventId }).catch(() => null)
    : Promise.resolve(null);

  const [asset, event] = await Promise.all([assetPromise, eventPromise]);

  return {
    album,
    asset,
    event,
    meta: {
      title: album.albumName,
    },
  };
}) satisfies PageLoad;
