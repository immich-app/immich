<script lang="ts">
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { makeSharedLinkUrl } from '$lib/utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  const handleClick = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] });

    if (sharedLink) {
      const urlKey = sharedLink.shareSlug ? sharedLink.shareSlug : sharedLink.key;
      await modalManager.show(QrCodeModal, { title: $t('view_link'), value: makeSharedLinkUrl(urlKey) });
    }
  };
</script>

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={mdiShareVariantOutline}
  onclick={handleClick}
  aria-label={$t('share')}
/>
