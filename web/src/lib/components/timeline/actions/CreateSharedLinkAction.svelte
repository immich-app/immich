<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { handleViewSharedLinkQrCode } from '$lib/services/shared-link.service';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const { getAssets } = getAssetControlContext();

  const handleClick = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, {
      assetIds: [...getAssets()].map(({ id }) => id),
    });

    if (sharedLink) {
      await handleViewSharedLinkQrCode(sharedLink);
    }
  };
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('share')}
  icon={mdiShareVariantOutline}
  onclick={handleClick}
/>
