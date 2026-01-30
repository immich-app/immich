<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { featureFlagsManager } from '$lib/managers/feature-flags-manager.svelte';
  import AssetDeleteConfirmModal from '$lib/modals/AssetDeleteConfirmModal.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { type OnDelete, type OnUndoDelete, deleteAssets } from '$lib/utils/actions';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiDeleteForeverOutline, mdiDeleteOutline, mdiTimerSand } from '@mdi/js';
  import { t } from 'svelte-i18n';

  type Props = {
    onAssetDelete: OnDelete;
    onUndoDelete?: OnUndoDelete | undefined;
    menuItem?: boolean;
    force?: boolean;
  };

  let { onAssetDelete, onUndoDelete = undefined, menuItem = false, force: forceRequested }: Props = $props();

  const force = $derived(forceRequested || !featureFlagsManager.value.trash);
  let label = $derived(force ? $t('permanently_delete') : $t('delete'));
  let loading = $state(false);

  const { clearSelect, getOwnedAssets } = getAssetControlContext();

  const onAction = async () => {
    const assets = getOwnedAssets();

    if (force && $showDeleteModal) {
      const confirmed = await modalManager.show(AssetDeleteConfirmModal, { size: assets.length });
      if (!confirmed) {
        return;
      }
    }

    loading = true;
    await deleteAssets(force, onAssetDelete, assets, onUndoDelete);
    clearSelect();
    loading = false;
  };
</script>

{#if menuItem}
  <MenuOption text={label} icon={mdiDeleteOutline} onClick={onAction} />
{:else if loading}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('loading')}
    icon={mdiTimerSand}
    onclick={() => {}}
  />
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={label}
    icon={mdiDeleteForeverOutline}
    onclick={onAction}
  />
{/if}
