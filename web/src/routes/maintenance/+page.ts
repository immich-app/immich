import { loadUser } from '$lib/utils/auth';
import type { PageLoad } from '../admin/$types';

export const load = (async () => {
  await loadUser();
}) satisfies PageLoad;
