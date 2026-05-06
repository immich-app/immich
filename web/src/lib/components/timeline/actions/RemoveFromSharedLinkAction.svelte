<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleRemoveSharedLinkAssets } from '$lib/services/shared-link.service';
  import { type SharedLinkResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiDeleteOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    sharedLink: SharedLinkResponseDto;
  }

  let { sharedLink = $bindable() }: Props = $props();

  const handleSelect = async () => {
    const assetIds = assetMultiSelectManager.assets.map(({ id }) => id);
    const success = await handleRemoveSharedLinkAssets(sharedLink, assetIds);
    if (success) {
      assetMultiSelectManager.clear();
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'Delete' }, onShortcut: handleSelect }} />

<IconButton
  shape="round"
  color="secondary"
  variant="ghost"
  aria-label={$t('remove_from_shared_link')}
  onclick={handleSelect}
  icon={mdiDeleteOutline}
/>
