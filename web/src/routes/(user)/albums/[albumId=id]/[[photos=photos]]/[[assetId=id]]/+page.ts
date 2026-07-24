import { getAllAlbums, getAlbumInfo, getAuthStatus } from '@immich/sdk';
import { error as kitError, redirect } from '@sveltejs/kit';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import type { PageLoad } from './$types';

export const load = (async ({ params, url, depends }) => {
  await authenticate(url);

  depends('album:data');

  try {
    const album = await getAlbumInfo({ id: params.albumId });
    return {
      album,
      meta: {
        title: album.albumName,
      },
    };
  } catch {
    // A locked album is denied entirely to a non-elevated session by the server (it doesn't
    // return isLocked=true, it just refuses access), so we can't distinguish "locked" from
    // "not found"/"no access" here via getAlbumInfo alone. If they already have a PIN, just send
    // them to unlock it.
    const { isElevated, pinCode } = await getAuthStatus();
    if (pinCode && !isElevated) {
      redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
    }

    if (!pinCode) {
      // No PIN yet -- before giving up, check if this is actually a locked album they're a real
      // member of (owned or shared with them). getAllAlbums has no lock-based filtering at all, so
      // it reveals membership regardless of lock status without exposing any album content. If
      // they're a genuine member, send them to set up a PIN instead of a dead-end "not found" --
      // the PIN prompt page already knows how to offer PIN creation when none exists. A total
      // stranger with no membership relation never reaches this branch with a true result, so
      // nothing is leaked to people who don't already have legitimate access.
      const albums = await getAllAlbums({});
      const isMember = albums.some((a) => a.id === params.albumId);
      if (isMember) {
        redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
      }
    }

    // Truly no relationship to this album -- surface a clean "not found" via SvelteKit's own error
    // helper instead of re-throwing the raw API client error, which renders as an ugly raw stack
    // trace instead of a normal error page. 404 rather than 403 to match the server's own
    // deliberate choice not to reveal whether a locked resource exists at all.
    kitError(404, 'Not found');
  }
}) satisfies PageLoad;
