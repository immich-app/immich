<script lang="ts">
  import { getAssetControlContext } from '$lib/components/timeline/AssetSelectControlBar.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { removeTag } from '$lib/utils/asset-utils';
  import { IconButton, modalManager, toastManager } from '@immich/ui';
  import { mdiTagRemoveOutline, mdiTagRemove } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import MenuOption from '../../shared-components/context-menu/menu-option.svelte';

  interface Props {
    tagId: string;
    onRemove: ((assetIds: string[]) => void) | undefined;
    menuItem?: boolean;
  }

  let { tagId, onRemove, menuItem = false }: Props = $props();

  const { getAssets, clearSelect } = getAssetControlContext();

  const removeTagFromAssets = async () => {
    const assets = getAssets();
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('remove_tag_from_assets_confirmation', { values: { count: assets.length } }),
    });

    if (!isConfirmed) {
      return;
    }

    try {
      const assetIds = [...assets].map((a) => a.id);

      await removeTag({
        assetIds,
        tagIds: [tagId],
        showNotification: true,
      });

      // Clear selection and trigger timeline refresh
      onRemove?.(assetIds);

      clearSelect();
    } catch (error) {
      handleError(error, $t('errors.error_removing_tag_from_assets'));
    }
  };
</script>

{#if menuItem}
  <MenuOption text={$t('remove_tag')} icon={mdiTagRemoveOutline} onClick={removeTagFromAssets} />
{:else}
  <IconButton
    shape="round"
    color="secondary"
    variant="ghost"
    aria-label={$t('remove_tag')}
    icon={mdiTagRemove}
    onclick={removeTagFromAssets}
  />
{/if}
