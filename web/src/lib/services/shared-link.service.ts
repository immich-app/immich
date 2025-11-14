import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { serverConfigManager } from '$lib/managers/server-config-manager.svelte';
import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
import { copyToClipboard } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createSharedLink,
  removeSharedLink,
  removeSharedLinkAssets,
  updateSharedLink,
  type SharedLinkCreateDto,
  type SharedLinkEditDto,
  type SharedLinkResponseDto,
} from '@immich/sdk';
import { MenuItemType, menuManager, modalManager, toastManager, type MenuItem } from '@immich/ui';
import { mdiCircleEditOutline, mdiContentCopy, mdiDelete, mdiDotsVertical, mdiQrcode } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getSharedLinkActions = ($t: MessageFormatter, sharedLink: SharedLinkResponseDto) => {
  const Edit: MenuItem = {
    title: $t('edit_link'),
    icon: mdiCircleEditOutline,
    onSelect: () => void goto(`${AppRoute.SHARED_LINKS}/${sharedLink.id}`),
  };

  const Delete: MenuItem = {
    title: $t('delete_link'),
    icon: mdiDelete,
    color: 'danger',
    onSelect: () => void handleDeleteSharedLink(sharedLink),
  };

  const Copy: MenuItem = {
    title: $t('copy_link'),
    icon: mdiContentCopy,
    onSelect: () => void copyToClipboard(asUrl(sharedLink)),
  };

  const ViewQrCode: MenuItem = {
    title: $t('view_qr_code'),
    icon: mdiQrcode,
    onSelect: () => void handleShowSharedLinkQrCode(sharedLink),
  };

  const ContextMenu: MenuItem = {
    title: $t('shared_link_options'),
    icon: mdiDotsVertical,
    onSelect: ({ event }) =>
      void menuManager.show({
        target: event.currentTarget as HTMLElement,
        position: 'top-right',
        items: [Edit, Copy, MenuItemType.Divider, Delete],
      }),
  };

  return { Edit, Delete, Copy, ViewQrCode, ContextMenu };
};

const asUrl = (sharedLink: SharedLinkResponseDto) => {
  const path = sharedLink.slug ? `s/${sharedLink.slug}` : `share/${sharedLink.key}`;
  return new URL(path, serverConfigManager.value.externalDomain || globalThis.location.origin).href;
};

export const handleCreateSharedLink = async (dto: SharedLinkCreateDto) => {
  const $t = await getFormatter();

  try {
    const sharedLink = await createSharedLink({ sharedLinkCreateDto: dto });

    eventManager.emit('SharedLinkCreate', sharedLink);

    // prevent nested modal
    void handleShowSharedLinkQrCode(sharedLink);

    return true;
  } catch (error) {
    handleError(error, $t('errors.failed_to_create_shared_link'));
    return false;
  }
};

export const handleUpdateSharedLink = async (sharedLink: SharedLinkResponseDto, dto: SharedLinkEditDto) => {
  const $t = await getFormatter();

  try {
    const response = await updateSharedLink({ id: sharedLink.id, sharedLinkEditDto: dto });

    eventManager.emit('SharedLinkUpdate', { album: sharedLink.album, ...response });
    toastManager.success($t('saved'));

    return true;
  } catch (error) {
    handleError(error, $t('errors.failed_to_edit_shared_link'));
    return false;
  }
};

export const handleDeleteSharedLink = async (sharedLink: SharedLinkResponseDto): Promise<boolean> => {
  const $t = await getFormatter();
  const success = await modalManager.showDialog({
    title: $t('delete_shared_link'),
    prompt: $t('confirm_delete_shared_link'),
    confirmText: $t('delete'),
  });
  if (!success) {
    return false;
  }

  try {
    await removeSharedLink({ id: sharedLink.id });
    eventManager.emit('SharedLinkDelete', sharedLink);
    toastManager.success($t('deleted_shared_link'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_shared_link'));
    return false;
  }
};

export const handleRemoveSharedLinkAssets = async (sharedLink: SharedLinkResponseDto, assetIds: string[]) => {
  const $t = await getFormatter();
  const success = await modalManager.showDialog({
    title: $t('remove_assets_title'),
    prompt: $t('remove_assets_shared_link_confirmation', { values: { count: assetIds.length } }),
    confirmText: $t('remove'),
  });
  if (!success) {
    return false;
  }

  try {
    const results = await removeSharedLinkAssets({
      ...authManager.params,
      id: sharedLink.id,
      assetIdsDto: { assetIds },
    });

    for (const result of results) {
      if (!result.success) {
        continue;
      }

      sharedLink.assets = sharedLink.assets.filter((asset) => asset.id !== result.assetId);
    }

    const count = results.filter((item) => item.success).length;
    toastManager.success($t('assets_removed_count', { values: { count } }));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_assets_from_shared_link'));
    return false;
  }
};

const handleShowSharedLinkQrCode = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  await modalManager.show(QrCodeModal, { title: $t('view_link'), value: asUrl(sharedLink) });
};
