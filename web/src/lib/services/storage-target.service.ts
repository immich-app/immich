import {
  createStorageTarget,
  deleteStorageTarget,
  exportToStorageTarget,
  importFromStorageTarget,
  StorageTargetKind,
  testStorageTarget,
  updateStorageTarget,
  type StorageTargetCreateDto,
  type StorageTargetResponseDto,
  type StorageTargetUpdateDto,
  type StorageTransferCreateDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import {
  mdiConnection,
  mdiDownloadOutline,
  mdiPencilOutline,
  mdiPlusBoxOutline,
  mdiTrashCanOutline,
  mdiUploadOutline,
} from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { eventManager } from '$lib/managers/event-manager.svelte';
import StorageTargetEditModal from '$lib/modals/StorageTargetEditModal.svelte';
import StorageTargetTransferModal from '$lib/modals/StorageTargetTransferModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';

export const getStorageTargetsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('admin.storage_target_create'),
    icon: mdiPlusBoxOutline,
    onAction: () => modalManager.show(StorageTargetEditModal, {}),
    shortcuts: { shift: true, key: 'n' },
  };

  return { Create };
};

export const getStorageTargetActions = ($t: MessageFormatter, target: StorageTargetResponseDto) => {
  const Test: ActionItem = {
    icon: mdiConnection,
    title: $t('admin.storage_target_test'),
    onAction: () => handleTestStorageTarget(target),
  };

  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => modalManager.show(StorageTargetEditModal, { target }),
  };

  const Export: ActionItem = {
    icon: mdiUploadOutline,
    title: $t('admin.storage_target_export'),
    onAction: () => modalManager.show(StorageTargetTransferModal, { target, direction: 'export' }),
  };

  const Import: ActionItem = {
    icon: mdiDownloadOutline,
    title: $t('admin.storage_target_import'),
    onAction: () => modalManager.show(StorageTargetTransferModal, { target, direction: 'import' }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    onAction: () => handleDeleteStorageTarget(target),
  };

  return { Test, Edit, Export, Import, Delete };
};

export const handleCreateStorageTarget = async (dto: StorageTargetCreateDto) => {
  const $t = await getFormatter();

  try {
    const target = await createStorageTarget({ storageTargetCreateDto: dto });
    toastManager.info($t('admin.storage_target_created'));
    eventManager.emit('StorageTargetUpdate', target);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_storage_target'));
    return false;
  }
};

export const handleUpdateStorageTarget = async (id: string, dto: StorageTargetUpdateDto) => {
  const $t = await getFormatter();

  try {
    const target = await updateStorageTarget({ id, storageTargetUpdateDto: dto });
    toastManager.info($t('admin.storage_target_updated'));
    eventManager.emit('StorageTargetUpdate', target);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_storage_target'));
    return false;
  }
};

const handleDeleteStorageTarget = async (target: StorageTargetResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    title: $t('admin.storage_target_delete'),
    prompt: $t('admin.storage_target_delete_prompt', { values: { name: target.name } }),
    confirmText: $t('delete'),
    confirmColor: 'danger',
  });

  if (!confirmed) {
    return;
  }

  try {
    await deleteStorageTarget({ id: target.id });
    toastManager.info($t('admin.storage_target_deleted'));
    eventManager.emit('StorageTargetUpdate', target);
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_storage_target'));
  }
};

const handleTestStorageTarget = async (target: StorageTargetResponseDto) => {
  const $t = await getFormatter();

  try {
    const result = await testStorageTarget({ id: target.id });
    if (result.ok) {
      toastManager.info($t('admin.storage_target_test_succeeded', { values: { name: target.name } }));
    } else {
      // A failed connection test is expected while credentials are being sorted
      // out, so it is surfaced as a message rather than an error toast.
      toastManager.danger(
        $t('admin.storage_target_test_failed', { values: { name: target.name, error: result.error ?? '' } }),
      );
    }
  } catch (error) {
    handleError(error, $t('errors.unable_to_test_storage_target'));
  }
};

export const handleStartTransfer = async (
  target: StorageTargetResponseDto,
  direction: 'export' | 'import',
  dto: StorageTransferCreateDto,
) => {
  const $t = await getFormatter();

  try {
    await (direction === 'export'
      ? exportToStorageTarget({ id: target.id, storageTransferCreateDto: dto })
      : importFromStorageTarget({ id: target.id, storageTransferCreateDto: dto }));

    toastManager.info(
      direction === 'export' ? $t('admin.storage_target_export_started') : $t('admin.storage_target_import_started'),
    );
    eventManager.emit('StorageTargetUpdate', target);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_start_storage_transfer'));
    return false;
  }
};

export const storageTargetKindLabel = ($t: MessageFormatter, kind: StorageTargetKind) => {
  switch (kind) {
    case StorageTargetKind.S3: {
      return $t('admin.storage_target_kind_s3');
    }
    case StorageTargetKind.Webdav: {
      return $t('admin.storage_target_kind_webdav');
    }
    case StorageTargetKind.Local: {
      return $t('admin.storage_target_kind_local');
    }
    default: {
      return kind;
    }
  }
};
