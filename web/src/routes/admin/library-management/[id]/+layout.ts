import { AppRoute } from '$lib/constants';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getLibrary, getLibraryStatistics, type LibraryResponseDto } from '@immich/sdk';
import { redirect } from '@sveltejs/kit';
import type { LayoutLoad } from './$types';

export const load = (async ({ params: { id }, url }) => {
  await authenticate(url, { admin: true });

  let library: LibraryResponseDto;

  try {
    library = await getLibrary({ id });
  } catch {
    redirect(307, AppRoute.ADMIN_LIBRARIES);
  }

  const statistics = await getLibraryStatistics({ id });
  const $t = await getFormatter();

  return {
    library,
    statistics,
    meta: {
      title: $t('admin.library_details'),
    },
  };
}) satisfies LayoutLoad;
