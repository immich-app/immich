import overpass from '$lib/assets/fonts/overpass/Overpass.ttf?url';
import overpassMono from '$lib/assets/fonts/overpass/OverpassMono.ttf?url';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
  // try to check maintenance status and redirect accordingly ahead of time
  let redirectToMode: boolean | undefined;
  try {
    const { maintenanceMode } = await fetch(process.env.IMMICH_SERVER_URL + 'api/config').then((response) =>
      response.json(),
    );

    if (maintenanceMode !== event.url.pathname.startsWith('/maintenance')) {
      redirectToMode = maintenanceMode;
    }
  } catch (err) {}

  if (typeof redirectToMode === 'boolean') throw redirect(302, redirectToMode ? '/maintenance' : '/');

  // replace the variables from app.html
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace('%app.font%', overpass).replace('%app.monofont%', overpassMono);
    },
  });
}) satisfies Handle;
