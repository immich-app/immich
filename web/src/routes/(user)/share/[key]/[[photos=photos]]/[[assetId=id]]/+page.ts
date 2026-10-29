import { loadSharedLink } from '#lib/utils/shared-links.ts';
import type { PageLoad } from './$types';

export const load = (async ({ params, url }) => loadSharedLink({ params, url })) satisfies PageLoad;
