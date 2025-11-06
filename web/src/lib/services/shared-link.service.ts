import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
import { serverConfig } from '$lib/stores/server-config.store';
import { copyToClipboard } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { createSharedLink, removeSharedLink, type SharedLinkCreateDto, type SharedLinkResponseDto } from '@immich/sdk';
import { MenuItemType, menuManager, modalManager, toastManager, type MenuItem } from '@immich/ui';
import { mdiCircleEditOutline, mdiContentCopy, mdiDelete, mdiDotsVertical, mdiQrcode } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getSharedLinkActions = ($t: MessageFormatter, sharedLink: SharedLinkResponseDto) => {
  return {
    Edit: {
      title: $t('edit_link'),
      icon: mdiCircleEditOutline,
      onSelect: () => void onEditSharedLink(sharedLink),
    },
    Copy: {
      title: $t('copy_link'),
      icon: mdiContentCopy,
      onSelect: () => void handleCopySharedLink(sharedLink),
    },
    Delete: {
      title: $t('delete_link'),
      icon: mdiDelete,
      color: 'danger',
      onSelect: () => void handleDeleteSharedLink(sharedLink),
    },
    ViewQrCode: {
      title: $t('view_qr_code'),
      icon: mdiQrcode,
      onSelect: () => void onViewSharedLinkQrCode(sharedLink),
    },
    ContextMenu: {
      title: $t('shared_link_options'),
      icon: mdiDotsVertical,
      onSelect: ({ event }) => void onOpenContextMenu(event as MouseEvent, sharedLink),
    },
  } satisfies Record<string, MenuItem>;
};

const onOpenContextMenu = async (
  { currentTarget, clientX, clientY }: MouseEvent,
  sharedLink: SharedLinkResponseDto,
) => {
  const SharedLinkActions = getSharedLinkActions(await getFormatter(), sharedLink);
  await menuManager.show({ currentTarget, clientX, clientY } as MouseEvent, {
    position: 'top-right',
    items: [SharedLinkActions.Edit, MenuItemType.Divider, SharedLinkActions.Copy, SharedLinkActions.Delete],
  });
};

const asUrl = (sharedLink: SharedLinkResponseDto) => {
  const path = sharedLink.slug ? `s/${sharedLink.slug}` : `share/${sharedLink.key}`;
  return new URL(path, get(serverConfig).externalDomain || globalThis.location.origin).href;
};

const handleCopySharedLink = async (sharedLink: SharedLinkResponseDto) => {
  await copyToClipboard(asUrl(sharedLink));
};

const onViewSharedLinkQrCode = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  await modalManager.show(QrCodeModal, { title: $t('view_link'), value: asUrl(sharedLink) });
};

export const handleCreateSharedLink = async (dto: SharedLinkCreateDto) => {
  try {
    const sharedLink = await createSharedLink({ sharedLinkCreateDto: dto });
    // prevent nested modals
    void onViewSharedLinkQrCode(sharedLink);
    return sharedLink;
  } catch (error) {
    const $t = await getFormatter();
    handleError(error, $t('errors.failed_to_create_shared_link'));
  }
};

const onEditSharedLink = async (sharedLink: SharedLinkResponseDto) => {
  await goto(`${AppRoute.SHARED_LINKS}/${sharedLink.id}`);
};

const handleDeleteSharedLink = async (sharedLink: SharedLinkResponseDto): Promise<boolean> => {
  const $t = await getFormatter();

  const isConfirmed = await modalManager.showDialog({
    title: $t('delete_shared_link'),
    prompt: $t('confirm_delete_shared_link'),
    confirmText: $t('delete'),
  });

  if (!isConfirmed) {
    return false;
  }

  try {
    await removeSharedLink({ id: sharedLink.id });
    toastManager.success($t('deleted_shared_link'));
    eventManager.emit('sharedLink.delete', sharedLink);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_shared_link'));
    return false;
  }
};
