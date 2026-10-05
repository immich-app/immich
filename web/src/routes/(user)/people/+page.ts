import { getAllPeople } from '@immich/sdk';
import { QueryParameter } from '$lib/constants';
import type { PeopleFilter } from '$lib/types';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  const getBoolean = (key: QueryParameter) => {
    const value = url.searchParams.get(key);
    return value === null ? undefined : value === 'true';
  };

  const filter: PeopleFilter = {
    sharedById: url.searchParams.get(QueryParameter.SHARED_BY_ID) ?? undefined,
    sharedWithId: url.searchParams.get(QueryParameter.SHARED_WITH_ID) ?? undefined,
    isFavorite: getBoolean(QueryParameter.IS_FAVORITE),
    isHidden: getBoolean(QueryParameter.IS_HIDDEN),
  };
  const people = await getAllPeople({ withHidden: true, ...filter });
  const $t = await getFormatter();

  return {
    people,
    filter,
    meta: {
      title: $t('people'),
    },
  };
}) satisfies PageLoad;
