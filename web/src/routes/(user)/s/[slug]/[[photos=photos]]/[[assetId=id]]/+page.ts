import { loadSharedLink } from '#lib/utils/shared-links.js';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => loadSharedLink({ params, url })) satisfies PageLoad;
