import { getSyncNode, getSyncPairing, getSyncPairingItems, SyncItemFilter } from '@immich/sdk';
import { authenticate } from '$lib/utils/auth';
import { getFormatter } from '$lib/utils/i18n';
import type { PageLoad } from './$types';
import { ITEM_LIMIT } from './constants';

export const load = (async ({ params, url }) => {
  await authenticate(url, { admin: true });

  const pairing = await getSyncPairing({ id: params.pairingId });

  // The node is what names the peer, and the two item lists answer different
  // questions: what is moving, and what has given up.
  const [node, active, stuck] = await Promise.all([
    getSyncNode({ id: pairing.nodeId }),
    getSyncPairingItems({ id: pairing.id, filter: SyncItemFilter.Active, size: ITEM_LIMIT }),
    getSyncPairingItems({ id: pairing.id, filter: SyncItemFilter.Stuck, size: ITEM_LIMIT }),
  ]);

  const $t = await getFormatter();

  return {
    pairing,
    node,
    active,
    stuck,
    meta: {
      title: $t('admin.sync_pairing_details'),
    },
  };
}) satisfies PageLoad;
