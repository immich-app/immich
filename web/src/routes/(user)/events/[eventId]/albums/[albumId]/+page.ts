import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async ({ params }) => {
  // Redirect to the standard album view
  throw redirect(302, `/albums/${params.albumId}`);
}) satisfies PageLoad;
