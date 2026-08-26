import {
  createSyncNode,
  createSyncPairing,
  deleteSyncNode,
  deleteSyncPairing,
  retrySyncPairingItems,
  syncPairingNow,
  testSyncNode,
  updateSyncNode,
  updateSyncPairing,
  type SyncNodeCreateDto,
  type SyncNodeResponseDto,
  type SyncNodeUpdateDto,
  type SyncPairingCreateDto,
  type SyncPairingItemDto,
  type SyncPairingResponseDto,
  type SyncPairingUpdateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiAccountSyncOutline,
  mdiConnection,
  mdiPencilOutline,
  mdiPlusBoxOutline,
  mdiProgressClock,
  mdiSync,
  mdiTrashCanOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import SyncNodeEditModal from '$lib/modals/SyncNodeEditModal.svelte';
import SyncPairingCreateModal from '$lib/modals/SyncPairingCreateModal.svelte';
import { Route } from '$lib/route';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getSyncNodesActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('admin.sync_node_add'),
    icon: mdiPlusBoxOutline,
    onAction: () => modalManager.show(SyncNodeEditModal, {}),
    shortcuts: { shift: true, key: 'n' },
  };

  return { Create };
};

export const getSyncNodeActions = ($t: MessageFormatter, node: SyncNodeResponseDto) => {
  const Test: ActionItem = {
    icon: mdiConnection,
    title: $t('admin.sync_node_test'),
    onAction: () => handleTestSyncNode(node),
  };

  const Pair: ActionItem = {
    icon: mdiAccountSyncOutline,
    title: $t('admin.sync_pairing_add'),
    onAction: () => modalManager.show(SyncPairingCreateModal, { node }),
  };

  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => modalManager.show(SyncNodeEditModal, { node }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    onAction: () => handleDeleteSyncNode(node),
  };

  return { Test, Pair, Edit, Delete };
};

export const getSyncPairingActions = ($t: MessageFormatter, pairing: SyncPairingResponseDto) => {
  const Details: ActionItem = {
    icon: mdiProgressClock,
    title: $t('admin.sync_pairing_view_details'),
    onAction: () => goto(Route.viewSyncPairing({ id: pairing.id })),
  };

  const SyncNow: ActionItem = {
    icon: mdiSync,
    title: $t('admin.sync_pairing_sync_now'),
    onAction: () => handleSyncNow(pairing),
  };

  const Unpair: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('admin.sync_pairing_remove'),
    color: 'danger',
    onAction: () => handleDeletePairing(pairing),
  };

  return { Details, SyncNow, Unpair };
};

export const handleCreateSyncNode = async (dto: SyncNodeCreateDto) => {
  const $t = await getFormatter();

  try {
    const node = await createSyncNode({ syncNodeCreateDto: dto });
    toastManager.info($t('admin.sync_node_added'));
    eventManager.emit('SyncNodeUpdate', node);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_sync_node'));
    return false;
  }
};

export const handleUpdateSyncNode = async (id: string, dto: SyncNodeUpdateDto) => {
  const $t = await getFormatter();

  try {
    const node = await updateSyncNode({ id, syncNodeUpdateDto: dto });
    toastManager.info($t('admin.sync_node_updated'));
    eventManager.emit('SyncNodeUpdate', node);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_sync_node'));
    return false;
  }
};

export const handleCreatePairing = async (node: SyncNodeResponseDto, dto: SyncPairingCreateDto) => {
  const $t = await getFormatter();

  try {
    await createSyncPairing({ id: node.id, syncPairingCreateDto: dto });
    toastManager.info($t('admin.sync_pairing_added'));
    eventManager.emit('SyncNodeUpdate', node);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_add_sync_pairing'));
    return false;
  }
};

export const handleUpdatePairing = async (pairing: SyncPairingResponseDto, dto: SyncPairingUpdateDto) => {
  const $t = await getFormatter();

  try {
    const updated = await updateSyncPairing({ id: pairing.id, syncPairingUpdateDto: dto });
    eventManager.emit('SyncNodeUpdate', { id: pairing.nodeId } as SyncNodeResponseDto);
    return updated;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_sync_pairing'));
    return null;
  }
};

const handleDeleteSyncNode = async (node: SyncNodeResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    title: $t('admin.sync_node_remove'),
    prompt: $t('admin.sync_node_remove_prompt', { values: { name: node.name } }),
    confirmText: $t('delete'),
    confirmColor: 'danger',
  });

  if (!confirmed) {
    return;
  }

  try {
    await deleteSyncNode({ id: node.id });
    toastManager.info($t('admin.sync_node_removed'));
    eventManager.emit('SyncNodeUpdate', node);
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_sync_node'));
  }
};

const handleDeletePairing = async (pairing: SyncPairingResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    title: $t('admin.sync_pairing_remove'),
    prompt: $t('admin.sync_pairing_remove_prompt', { values: { email: pairing.remoteUserEmail } }),
    confirmText: $t('delete'),
    confirmColor: 'danger',
  });

  if (!confirmed) {
    return;
  }

  try {
    await deleteSyncPairing({ id: pairing.id });
    toastManager.info($t('admin.sync_pairing_removed'));
    eventManager.emit('SyncNodeUpdate', { id: pairing.nodeId } as SyncNodeResponseDto);
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_sync_pairing'));
  }
};

/**
 * Puts every item that has run out of attempts back in the queue.
 *
 * Confirmed rather than immediate: if whatever broke these is still broken they
 * will just burn through their attempts again, and the count says how much work
 * that would be.
 */
export const handleRetryStuckItems = async (pairing: SyncPairingResponseDto) => {
  const $t = await getFormatter();

  if (pairing.stuckCount === 0) {
    toastManager.info($t('admin.sync_pairing_retry_nothing'));
    return false;
  }

  const confirmed = await modalManager.showDialog({
    title: $t('admin.sync_pairing_retry_title'),
    prompt: $t('admin.sync_pairing_retry_prompt', { values: { count: pairing.stuckCount } }),
    confirmText: $t('admin.sync_pairing_retry'),
  });

  if (!confirmed) {
    return false;
  }

  return retryItems(pairing.id, {});
};

/** Retries one item, for when only a single asset was the problem. */
export const handleRetryStuckItem = async (pairing: SyncPairingResponseDto, item: SyncPairingItemDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    title: $t('admin.sync_pairing_retry_title'),
    prompt: $t('admin.sync_pairing_retry_item_prompt', { values: { name: item.fileName ?? item.assetId } }),
    confirmText: $t('admin.sync_pairing_retry'),
  });

  if (!confirmed) {
    return false;
  }

  return retryItems(pairing.id, { itemIds: [item.id] });
};

const retryItems = async (id: string, syncPairingRetryDto: { itemIds?: string[] }) => {
  const $t = await getFormatter();

  try {
    const { count } = await retrySyncPairingItems({ id, syncPairingRetryDto });
    toastManager.info($t('admin.sync_pairing_retry_queued', { values: { count } }));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_retry_sync_items'));
    return false;
  }
};

const handleSyncNow = async (pairing: SyncPairingResponseDto) => {
  const $t = await getFormatter();

  try {
    await syncPairingNow({ id: pairing.id });
    toastManager.info($t('admin.sync_pairing_queued'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_start_sync'));
  }
};

const handleTestSyncNode = async (node: SyncNodeResponseDto) => {
  const $t = await getFormatter();

  try {
    const result = await testSyncNode({ id: node.id });
    if (result.ok) {
      toastManager.info($t('admin.sync_node_test_succeeded', { values: { name: node.name } }));
    } else {
      // A failing check is an expected part of setting a node up, so it reads as
      // a message rather than an unexpected error.
      toastManager.danger(
        $t('admin.sync_node_test_failed', { values: { name: node.name, error: result.error ?? '' } }),
      );
    }
    eventManager.emit('SyncNodeUpdate', node);
  } catch (error) {
    handleError(error, $t('errors.unable_to_test_sync_node'));
  }
};
