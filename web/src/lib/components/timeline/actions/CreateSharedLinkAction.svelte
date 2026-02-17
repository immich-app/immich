<script lang="ts">
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { getAssetControlContext } from '$lib/utils/context';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const { getAssets } = getAssetControlContext();

  const handleClick = async () => {
    await modalManager.show(SharedLinkCreateModal, { assetIds: [...getAssets()].map(({ id }) => id) });
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
