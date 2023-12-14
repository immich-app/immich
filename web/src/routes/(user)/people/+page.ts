import { authenticate } from '$lib/utils/auth';
import { api } from '@api';
import type { PageLoad } from './$types';

export const load = (async () => {
  await authenticate();

  const { data: people } = await api.personApi.getAllPeople({ withHidden: true });
  return {
    people,
    meta: {
      title: 'People',
    },
  };
}) satisfies PageLoad;
