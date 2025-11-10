import { eventManager } from '$lib/managers/event-manager.svelte';
import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
import { serverConfig } from '$lib/stores/server-config.store';
import { copyToClipboard } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createSharedLink,
  updateSharedLink,
  type SharedLinkCreateDto,
  type SharedLinkEditDto,
  type SharedLinkResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { get } from 'svelte/store';

const makeSharedLinkUrl = (sharedLink: SharedLinkResponseDto) => {
  const path = sharedLink.slug ? `s/${sharedLink.slug}` : `share/${sharedLink.key}`;
  return new URL(path, get(serverConfig).externalDomain || globalThis.location.origin).href;
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

export const handleShowSharedLinkQrCode = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  await modalManager.show(QrCodeModal, { title: $t('view_link'), value: makeSharedLinkUrl(sharedLink) });
};

export const handleCopySharedLinkUrl = async (sharedLink: SharedLinkResponseDto) => {
  await copyToClipboard(makeSharedLinkUrl(sharedLink));
};
