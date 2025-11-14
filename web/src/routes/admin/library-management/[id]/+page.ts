import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getLibrary, getLibraryStatistics } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ params: { id }, url }) => {
  await authenticate(url, { admin: true });
  const library = await getLibrary({ id });
  const statistics = await getLibraryStatistics({ id });
  const $t = await getFormatter();

  return {
    library,
    statistics,
    meta: {
      title: $t('admin.library_details'),
    },
  };
}) satisfies PageLoad;
