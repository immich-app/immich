import { authenticate, loadUser } from '$lib/utils/auth';
import { getAllAlbums, getEventInfo } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params, parent, depends }) => {
  const dependencyKey = `app:event:${params.eventId}:albums`;
  depends(dependencyKey);
  await authenticate({ parent });
  const user = await loadUser();

  const [event, albums] = await Promise.all([
    getEventInfo({ id: params.eventId }),
    getAllAlbums({ eventId: params.eventId }),
  ]);

  // Separate albums into owned and shared based on current user
  const ownedAlbums = albums.filter((album) => album.ownerId === user?.id);
  const sharedAlbums = albums.filter((album) => album.ownerId !== user?.id);

  return {
    event,
    albums,
    ownedAlbums,
    sharedAlbums,
    meta: {
      title: event.eventName,
    },
  };
}) satisfies PageLoad;
