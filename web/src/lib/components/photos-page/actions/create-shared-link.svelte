<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { makeSharedLinkUrl } from '$lib/utils';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const { getAssets } = getAssetControlContext();

  const handleClick = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, {
      assetIds: [...getAssets()].map(({ id }) => id),
    });

    if (sharedLink) {
      const url = makeSharedLinkUrl($serverConfig.externalDomain, sharedLink.key);
      await modalManager.show(QrCodeModal, { title: $t('view_link'), value: url });
    }
  };
</script>

<CircleIconButton title={$t('share')} icon={mdiShareVariantOutline} onclick={handleClick} />
