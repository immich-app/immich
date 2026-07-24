<script lang="ts">
  import { AssetVisibility, updateAssets } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { mdiLockOpenVariantOutline, mdiLockOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import MenuOption from '$lib/components/shared-components/context-menu/MenuOption.svelte';
  import { AssetAction } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { Route } from '$lib/route';
  import { handleError } from '$lib/utils/handle-error';
  import type { OnAction, PreAction } from './action';

  interface Props {
    asset: TimelineAsset;
    onAction: OnAction;
    preAction: PreAction;
  }

  let { asset, onAction, preAction }: Props = $props();
  const isLocked = asset.visibility === AssetVisibility.Locked;

  const toggleLockedVisibility = async () => {
    const isConfirmed = await modalManager.showDialog({
      title: isLocked ? $t('move_out_locked_folder') : $t('move_to_locked_folder'),
      prompt: isLocked
        ? $t('move_out_locked_folder_confirmation', { values: { count: 1 } })
        : $t('move_to_locked_folder_confirmation', { values: { count: 1 } }),
      confirmText: $t('move'),
      confirmColor: isLocked ? 'danger' : 'primary',
      icon: isLocked ? mdiLockOpenVariantOutline : mdiLockOutline,
    });

    if (!isConfirmed) {
      return;
    }

    // Unlocking a Locked asset already requires an elevated session server-side (same rule as
    // every other locked-content mutation) -- redirect to the PIN prompt instead of letting a raw
    // access error surface. Locking never requires elevation, matching the rest of this feature.
    if (isLocked && !authManager.isElevated) {
      await goto(Route.pinPrompt({ continue: `${page.url.pathname}${page.url.search}` }));
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
  text={isLocked ? $t('move_out_locked_folder') : $t('move_to_locked_folder')}
  icon={isLocked ? mdiLockOpenVariantOutline : mdiLockOutline}
/>
