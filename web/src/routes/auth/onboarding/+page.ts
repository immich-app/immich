import { AppRoute } from '$lib/constants';
import { api } from '@api';
import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load = (async () => {
  return {
    meta: {
      title: 'Onboarding',
    },
  };
}) satisfies PageLoad;
