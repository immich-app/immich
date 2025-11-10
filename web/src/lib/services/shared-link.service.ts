import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
import { serverConfig } from '$lib/stores/server-config.store';
import { copyToClipboard } from '$lib/utils';
import { getFormatter } from '$lib/utils/i18n';
import type { SharedLinkResponseDto } from '@immich/sdk';
import { modalManager } from '@immich/ui';
import { get } from 'svelte/store';

const makeSharedLinkUrl = (sharedLink: SharedLinkResponseDto) => {
  const path = sharedLink.slug ? `s/${sharedLink.slug}` : `share/${sharedLink.key}`;
  return new URL(path, get(serverConfig).externalDomain || globalThis.location.origin).href;
};

export const handleViewSharedLinkQrCode = async (sharedLink: SharedLinkResponseDto) => {
  const $t = await getFormatter();
  await modalManager.show(QrCodeModal, { title: $t('view_link'), value: makeSharedLinkUrl(sharedLink) });
};

export const handleCopySharedLinkUrl = async (sharedLink: SharedLinkResponseDto) => {
  await copyToClipboard(makeSharedLinkUrl(sharedLink));
};
