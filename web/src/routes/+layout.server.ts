import type { LayoutServerLoad } from './$types';

export const load = (async ({ locals: { user }, cookies }) => {
  const privateAlbumToken = cookies.get('immich_private_album_token');

  return { user, privateAlbumToken };
}) satisfies LayoutServerLoad;
