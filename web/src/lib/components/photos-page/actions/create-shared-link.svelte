<script lang="ts">
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { makeSharedLinkUrl } from '$lib/utils';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { IconButton } from '@immich/ui';

  const { getAssets } = getAssetControlContext();

  const handleClick = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, {
      assetIds: [...getAssets()].map(({ id }) => id),
    });

    if (sharedLink) {
      await modalManager.show(QrCodeModal, { title: $t('view_link'), value: makeSharedLinkUrl(sharedLink.key) });
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
