import overpass from '$lib/assets/fonts/overpass/Overpass.ttf?url';
import overpassMono from '$lib/assets/fonts/overpass/OverpassMono.ttf?url';
import { transpileFile } from '$lib/utils/app-utils';
import fouc from '$lib/utils/app?raw';
import theme from '$lib/utils/theme?raw';
import type { Handle } from '@sveltejs/kit';

// only used during the build to replace the variables from app.html
export const handle = (async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const themePrepared = theme.replaceAll(/^export\s+/gm, '');
      const foucPrepared = fouc.replaceAll(/^import.*$/gm, themePrepared);
      const scriptFouc = `<script>${transpileFile(foucPrepared)}</script>`;

      return html
        .replace('%app.font%', overpass)
        .replace('%app.monofont%', overpassMono)
        .replace('%app.fouc%', scriptFouc);
    },
  });
}) satisfies Handle;
