<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiShareVariantOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  const handleClick = async () => {
    await modalManager.show(SharedLinkCreateModal, { assetIds: assetMultiSelectManager.assets.map(({ id }) => id) });
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
