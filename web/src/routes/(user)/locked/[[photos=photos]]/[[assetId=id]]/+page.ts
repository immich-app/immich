import { redirect } from '@sveltejs/kit';
import { Route } from '$lib/route';
import { confirmLockedAccess } from '$lib/services/locked-access';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url }) => {
  await authenticate(url);

  let lockedUntil: number;
  try {
    lockedUntil = await confirmLockedAccess();
  } catch {
    redirect(307, Route.pinPrompt({ continue: url.pathname + url.search }));
  }

  const $t = await getFormatter();

  return {
    lockedUntil,
    meta: {
      title: $t('locked_folder'),
    },
  };
}) satisfies PageLoad;
