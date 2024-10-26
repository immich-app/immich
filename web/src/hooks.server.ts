import overpass from '$lib/assets/fonts/overpass/Overpass.ttf?url';
import overpassMono from '$lib/assets/fonts/overpass/OverpassMono.ttf?url';
import fouc from '$lib/utils/app?raw';
import type { Handle } from '@sveltejs/kit';
import { ModuleKind, transpileModule } from 'typescript';

const transpileFile = (content: string) => {
  const result = transpileModule(content, {
    compilerOptions: { module: ModuleKind.ES2020, removeComments: true },
  });
  return result.outputText;
};

// only used during the build to replace the variables from app.html
export const handle = (async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      const scriptFouc = `<script>${transpileFile(fouc)}</script>`;

      return html
        .replace('%app.font%', overpass)
        .replace('%app.monofont%', overpassMono)
        .replace('%app.fouc%', scriptFouc);
    },
  });
}) satisfies Handle;
