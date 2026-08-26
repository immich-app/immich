import { getSyncNodes, getSyncPairings } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';

export const load = (async ({ url, depends }) => {
  depends('app:sync-nodes');
  await authenticate(url, { admin: true });

  const nodes = await getSyncNodes();
  const $t = await getFormatter();

  // Pairings hang off a node, so they are fetched alongside rather than being a
  // second round-trip once the page has rendered.
  const pairings = await Promise.all(nodes.map(async ({ id }) => [id, await getSyncPairings({ id })] as const));

  return {
    nodes,
    pairings: Object.fromEntries(pairings),
    meta: {
      title: $t('admin.sync_nodes'),
    },
  };
}) satisfies PageLoad;
