<script lang="ts">
  import { page } from '$app/state';
  import { getAssetControlContext } from '$lib/components/photos-page/asset-select-control-bar.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { dialogController } from '$lib/components/shared-components/dialog/dialog';
  import type { OnSetVisibility } from '$lib/utils/actions';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetVisibility, updateAssets } from '@immich/sdk';
  import { Button } from '@immich/ui';
  import { mdiEyeOffOutline, mdiFolderMoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    onVisibilitySet: OnSetVisibility;
    menuItem?: boolean;
  }

  let { onVisibilitySet, menuItem = false }: Props = $props();
  let loading = $state(false);
  const { getAssets } = getAssetControlContext();
  let isInLockedView = $derived(page.url.pathname.includes('/locked'));

  const setLockedVisibility = async () => {
    const isConfirmed = await dialogController.show({
      title: isInLockedView ? $t('remove_from_locked_folder') : $t('move_to_locked_folder'),
      prompt: isInLockedView ? $t('remove_from_locked_folder_confirmation') : $t('move_to_locked_folder_confirmation'),
      confirmText: $t('move'),
      confirmColor: isInLockedView ? 'danger' : 'primary',
    });

    if (!isConfirmed) {
      return;
    }
    try {
      loading = true;
      const assetIds = [...getAssets()].map((asset) => asset.id);

      await updateAssets({
        assetBulkUpdateDto: {
          ids: assetIds,
          visibility: isInLockedView ? AssetVisibility.Timeline : AssetVisibility.Locked,
        },
      });

      onVisibilitySet(assetIds);
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_settings'));
    } finally {
      loading = false;
    }
  };
</script>

{#if menuItem}
  <MenuOption
    onClick={setLockedVisibility}
    text={isInLockedView ? $t('move_off_locked_folder') : $t('add_to_locked_folder')}
    icon={isInLockedView ? mdiFolderMoveOutline : mdiEyeOffOutline}
  />
{:else}
  <Button
    leadingIcon={isInLockedView ? mdiFolderMoveOutline : mdiEyeOffOutline}
    disabled={loading}
    size="medium"
    color="secondary"
    variant="ghost"
    onclick={setLockedVisibility}
  >
    {isInLockedView ? $t('move_off_locked_folder') : $t('add_to_locked_folder')}
  </Button>
{/if}
