import overpass from '$lib/assets/fonts/overpass/Overpass.ttf?url';
import overpassMono from '$lib/assets/fonts/overpass/OverpassMono.ttf?url';
import { redirect, type Handle } from '@sveltejs/kit';

export const handle = (async ({ event, resolve }) => {
  // try to check maintenance status and redirect accordingly ahead of time
  const redirectToMaintenance = await fetch(process.env.IMMICH_SERVER_URL + 'api/server/config')
    .then((response) => response.json())
    .then(({ maintenanceMode }: { maintenanceMode: boolean }) => maintenanceMode)
    .catch((_) => false)
    .then((maintenanceMode) =>
      maintenanceMode === event.url.pathname.startsWith('/maintenance') ? undefined : maintenanceMode,
    );

  if (typeof redirectToMaintenance === 'boolean') {
    throw redirect(302, redirectToMaintenance ? '/maintenance' : '/');
  }

  // replace the variables from app.html
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace('%app.font%', overpass).replace('%app.monofont%', overpassMono);
    },
  });
}) satisfies Handle;
