import { redirect } from '@sveltejs/kit';
import { queryClient } from '$lib/queries/client';
import { getAllLibrariesQuery } from '$lib/queries/library.query';
import { Route } from '$lib/route';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { LayoutLoad } from './$types';

export const load = (async ({ params: { id }, url }) => {
  await authenticate(url, { admin: true });

  const libraries = await queryClient.query(getAllLibrariesQuery());
  if (libraries.every((library) => library.id !== id)) {
    redirect(307, Route.libraries());
  }

  const $t = await getFormatter();

  return {
    meta: {
      title: $t('admin.library_details'),
    },
  };
}) satisfies LayoutLoad;
