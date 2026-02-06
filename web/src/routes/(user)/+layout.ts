import { authenticate } from '$lib/utils/auth';
import type { LayoutLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  return {};
}) satisfies LayoutLoad;
