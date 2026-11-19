import { fetchFirstPeoplePage } from '#lib/queries/person.query.ts';
import { authenticate } from '#lib/utils/auth.ts';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);
  await fetchFirstPeoplePage({ withHidden: true });
}) satisfies PageLoad;
