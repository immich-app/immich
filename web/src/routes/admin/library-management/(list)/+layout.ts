import { authenticate, requestServerInfo } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import { getAllLibraries, getLibraryStatistics, getUserAdmin, searchUsersAdmin } from '@immich/sdk';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url, { admin: true });
  await requestServerInfo();
  const allUsers = await searchUsersAdmin({ withDeleted: false });
  const $t = await getFormatter();

  const libraries = await getAllLibraries();
  const statistics = await Promise.all(
    libraries.map(async ({ id }) => [id, await getLibraryStatistics({ id })] as const),
  );
  const owners = await Promise.all(
    libraries.map(async ({ id, ownerId }) => [id, await getUserAdmin({ id: ownerId })] as const),
  );

  return {
    allUsers,
    libraries,
    statistics: Object.fromEntries(statistics),
    owners: Object.fromEntries(owners),
    meta: {
      title: $t('external_libraries'),
    },
  };
}) satisfies PageLoad;
