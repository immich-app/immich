import GoogleSans from '$lib/assets/fonts/GoogleSans/GoogleSans.ttf?url';
import GoogleSansCode from '$lib/assets/fonts/GoogleSansCode/GoogleSansCode.ttf?url';
import type { Handle } from '@sveltejs/kit';

// only used during the build to replace the variables from app.html
export const handle = (async ({ event, resolve }) => {
  return resolve(event, {
    transformPageChunk: ({ html }) => {
      return html.replace('%app.font%', GoogleSans).replace('%app.monofont%', GoogleSansCode);
    },
  });
}) satisfies Handle;
