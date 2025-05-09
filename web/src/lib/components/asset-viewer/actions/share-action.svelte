<script lang="ts">
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import QrCodeModal from '$lib/modals/QrCodeModal.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { serverConfig } from '$lib/stores/server-config.store';
  import { makeSharedLinkUrl } from '$lib/utils';
  import type { AssetResponseDto } from '@immich/sdk';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  const handleClick = async () => {
    const sharedLink = await modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] });

    if (sharedLink) {
      const url = makeSharedLinkUrl($serverConfig.externalDomain, sharedLink.key);
      await modalManager.show(QrCodeModal, { title: $t('view_link'), value: url });
    }
  };
</script>

<CircleIconButton color="opaque" icon={mdiShareVariantOutline} onclick={handleClick} title={$t('share')} />
