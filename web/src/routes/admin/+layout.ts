import { authenticate } from '#lib/utils/auth.js';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
}) satisfies LayoutLoad;
