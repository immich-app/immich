import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url, fetch }) => {
  const $t = await getFormatter();
  const token = url.searchParams.get('token');
  const timestamp = url.searchParams.get('timestamp');
  let isValid = false;

  if (token && timestamp) {
    try {
      const res = await fetch(
        import.meta.env.VITE_API_URL + '/api/auth/password-reset/validate-token',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, timestamp }),
        }
      );
      isValid = res.status === 200;
    } catch (e) {
      isValid = false;
    }
  }

  return {
    meta: {
      title: $t('change_password'),
    },
    token,
    timestamp,
    isValid,
  };
}) satisfies PageLoad;
