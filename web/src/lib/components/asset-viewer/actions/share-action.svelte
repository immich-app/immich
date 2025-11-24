<script lang="ts">
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import type { AssetResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
  }

  let { asset }: Props = $props();

  const handleClick = async () => {
    await modalManager.show(SharedLinkCreateModal, { assetIds: [asset.id] });
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
