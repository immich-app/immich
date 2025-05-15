<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';

  import { AssetAction } from '$lib/constants';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetVisibility, updateAssets, Visibility, type AssetResponseDto } from '@immich/sdk';
  import { mdiEyeOffOutline, mdiFolderMoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction, PreAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    preAction: PreAction;
  }

  let { asset, onAction, preAction }: Props = $props();
  const isLocked = asset.visibility === Visibility.Locked;

  const toggleLockedVisibility = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: isLocked ? $t('remove_from_locked_folder') : $t('move_to_locked_folder'),
      prompt: isLocked ? $t('remove_from_locked_folder_confirmation') : $t('move_to_locked_folder_confirmation'),
      confirmText: $t('move'),
      confirmColor: isLocked ? 'danger' : 'primary',
    });

    if (!isConfirmed) {
      return;
    }

    try {
      preAction({
        type: isLocked ? AssetAction.SET_VISIBILITY_TIMELINE : AssetAction.SET_VISIBILITY_LOCKED,
        asset,
      });

      await updateAssets({
        assetBulkUpdateDto: {
          ids: [asset.id],
          visibility: isLocked ? AssetVisibility.Timeline : AssetVisibility.Locked,
        },
      });

      onAction({
        type: isLocked ? AssetAction.SET_VISIBILITY_TIMELINE : AssetAction.SET_VISIBILITY_LOCKED,
        asset,
      });
    } catch (error) {
      handleError(error, $t('errors.unable_to_save_settings'));
    }
  };
</script>

<MenuOption
  onClick={() => toggleLockedVisibility()}
  text={isLocked ? $t('move_off_locked_folder') : $t('add_to_locked_folder')}
  icon={isLocked ? mdiFolderMoveOutline : mdiEyeOffOutline}
/>
