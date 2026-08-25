import { getStorageTargets, getStorageTargetTransfers } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url, depends }) => {
  depends('app:storage-targets');
  await authenticate(url, { admin: true });

  const targets = await getStorageTargets();
  const $t = await getFormatter();

  // Transfers are per-target, so they are fetched alongside rather than being a
  // second round-trip once the page has rendered.
  const transfers = await Promise.all(
    targets.map(async ({ id }) => [id, await getStorageTargetTransfers({ id })] as const),
  );

  return {
    targets,
    transfers: Object.fromEntries(transfers),
    meta: {
      title: $t('admin.storage_targets'),
    },
  };
}) satisfies PageLoad;
