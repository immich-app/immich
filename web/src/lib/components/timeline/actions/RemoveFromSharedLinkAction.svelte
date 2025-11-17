<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { handleRemoveSharedLinkAssets } from '$lib/services/shared-link.service';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink = $bindable() }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  const handleSelect = async () => {
    const assetIds = getAssets().map(({ id }) => id);
    const success = await handleRemoveSharedLinkAssets(sharedLink, assetIds);
    if (success) {
      clearSelect();
    }
  };
</script>

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('remove_from_shared_link')}
  onclick={handleSelect}
  icon={mdiDeleteOutline}
/>
