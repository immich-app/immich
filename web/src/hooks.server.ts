import overpass from '$lib/assets/fonts/overpass/Overpass.ttf?url';
import overpassMono from '$lib/assets/fonts/overpass/OverpassMono.ttf?url';
import type { Handle } from '@sveltejs/kit';

// only used during the build to replace the variables from app.html
export const handle = (async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace('%app.font%', overpass).replace('%app.monofont%', overpassMono);
    },
  });
}) satisfies Handle;
