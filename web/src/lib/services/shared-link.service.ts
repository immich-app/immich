import QrCodeModal from '#lib/modals/QrCodeModal.svelte';
import { executeMutation, readPreloadedQuery } from '#lib/queries/client.ts';
import { getUserConfigQuery } from '#lib/queries/config-user.query.ts';
import { removeSharedLinkMutation } from '#lib/queries/shared-link.query.ts';
import { Route } from '#lib/route.ts';
import { copyToClipboard } from '#lib/utils.ts';
import { getFormatter } from '#lib/utils/i18n.ts';
import { type SharedLinkResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiContentCopy, mdiLink, mdiPencilOutline, mdiQrcode, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';

export const getSharedLinksActions = ($t: MessageFormatter) => {
  const ViewAll: ActionItem = {
    title: $t('shared_links'),
    icon: mdiLink,
    onAction: () => goto(Route.sharedLinks()),
  };

  return { ViewAll };
};

export const getSharedLinkActions = ($t: MessageFormatter, sharedLink: SharedLinkResponseDto) => {
  const Edit: ActionItem = {
    title: $t('edit_link'),
    icon: mdiPencilOutline,
    onAction: () => goto(Route.editSharedLink(sharedLink)),
  };

  const Delete: ActionItem = {
    title: $t('delete_link'),
    icon: mdiTrashCanOutline,
    color: 'danger',
    onAction: () => handleDeleteSharedLink(sharedLink),
  };

  const Copy: ActionItem = {
    title: $t('copy_link'),
    icon: mdiContentCopy,
    onAction: () => copyToClipboard(asUrl(sharedLink)),
  };

  const ViewQrCode: ActionItem = {
    title: $t('view_qr_code'),
    icon: mdiQrcode,
    onAction: () => showSharedLinkQrCode(sharedLink),
  };

  return { Edit, Delete, Copy, ViewQrCode };
};

export const asUrl = (sharedLink: SharedLinkResponseDto) => {
  const path = Route.viewSharedLink(sharedLink);
  return new URL(path, readPreloadedQuery(getUserConfigQuery()).server.externalDomain || location.origin).href;
};

export const showSharedLinkQrCode = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  await modalManager.show(QrCodeModal, { title: $t('view_link'), value: asUrl(sharedLink) });
};

const handleDeleteSharedLink = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  const success = await modalManager.showDialog({
    title: $t('delete_shared_link'),
    prompt: $t('confirm_delete_shared_link'),
    confirmText: $t('delete'),
  });
  if (!success) {
    return;
  }

  await executeMutation(removeSharedLinkMutation, [{ id: sharedLink.id }]);
};
