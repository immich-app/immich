import { authenticate } from '$lib/utils/auth';
import { getAllAlbums, getEventInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, parent, depends }) => {
  const dependencyKey = `app:event:${params.eventId}:albums`;
  depends(dependencyKey);
  await authenticate({ parent });

  const event = await getEventInfo({ id: params.eventId });
  const [ownedAlbums, sharedAlbums] = await Promise.all([
    getAllAlbums({ eventId: params.eventId }),
    getAllAlbums({ eventId: params.eventId, shared: true }),
  ]);

  const albums = [...ownedAlbums, ...sharedAlbums];

  return {
    event,
    albums,
    meta: {
      title: event.eventName,
    },
  };
}) satisfies PageLoad;
