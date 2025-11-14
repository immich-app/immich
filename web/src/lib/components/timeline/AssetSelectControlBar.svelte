<script lang="ts" module>
  import { createContext } from '$lib/utils/context';
  import { t } from 'svelte-i18n';

  export interface AssetControlContext {
    getAssets: () => TimelineAsset[];
    getOwnedAssets: () => TimelineAsset[];
    clearSelect: () => void;
  }

  const { get: getAssetControlContext, set: setContext } = createContext<AssetControlContext>();
  export { getAssetControlContext };
</script>

<script lang="ts">
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AssetAction } from '$lib/constants';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getBaseUrl, type AssetResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiClose, mdiEye, mdiEyeOff } from '@mdi/js';
  import type { Snippet } from 'svelte';
  import ControlAppBar from '../shared-components/control-app-bar.svelte';

  interface Props {
    assets: TimelineAsset[];
    clearSelect: () => void;
    ownerId?: string | undefined;
    children?: Snippet;
    forceDark?: boolean;
    onAction?: (action: Action) => void;
  }

  let { assets, clearSelect, ownerId = undefined, children, forceDark, onAction }: Props = $props();

  let blurState = $derived.by(() => {
    return {
      allBlurred: assets.every((a) => a.isBlurred),
      someBlurred: assets.some((a) => a.isBlurred),
    };
  });

  setContext({
    getAssets: () => assets,
    getOwnedAssets: () => (ownerId === undefined ? assets : assets.filter((asset) => asset.ownerId === ownerId)),
    clearSelect,
  });

  const toggleBlurForSelected = async () => {
    if (!assets.length) return;

    try {
      for (const asset of assets) {
        asset.isBlurred = !asset.isBlurred;
      }

      const response = await fetch(`${getBaseUrl()}/assets/blur/bulk`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetIds: assets.map((a) => a.id) }),
      });

      if (!response.ok) {
        throw new Error('Blur update failed');
      }

      const updatedAssets: AssetResponseDto[] = await response.json();
      const updatedTimelineAssets: TimelineAsset[] = updatedAssets.map(
        (asset: AssetResponseDto): TimelineAsset => toTimelineAsset(asset),
      );

      for (let i = 0; i < assets.length; i++) {
        assets[i].isBlurred = updatedTimelineAssets[i].isBlurred;
      }

      if (onAction) {
        for (const updatedAsset of updatedTimelineAssets) {
          onAction({
            type: AssetAction.BLUR,
            asset: updatedAsset,
          });
        }
      }

      notificationController.show({
        type: NotificationType.Info,
        message: `Blur update on ${updatedAssets.length} item${updatedAssets.length > 1 ? 's' : ''}.`,
      });
    } catch (error) {
      for (const asset of assets) {
        asset.isBlurred = !asset.isBlurred;
      }
      console.error('Error in toggleBlurForSelected:', error);
      notificationController.show({
        type: NotificationType.Error,
        message: 'It is not possible to modify the blur on the selected items.',
      });
    }
  };
</script>

<ControlAppBar onClose={clearSelect} {forceDark} backIcon={mdiClose} tailwindClasses="bg-white shadow-md">
  {#snippet leading()}
    <div class="font-medium {forceDark ? 'text-immich-dark-primary' : 'text-primary'}">
      <p class="block sm:hidden">{assets.length}</p>
      <p class="hidden sm:block">{$t('selected_count', { values: { count: assets.length } })}</p>
    </div>
  {/snippet}
  {#snippet trailing()}
    <IconButton
      color="secondary"
      shape="round"
      variant="ghost"
      icon={blurState.allBlurred ? mdiEyeOff : mdiEye}
      aria-label={blurState.allBlurred
        ? 'Unblur all'
        : blurState.someBlurred
          ? 'Toggle blur for selection'
          : 'Blur all'}
      onclick={toggleBlurForSelected}
    />

    {@render children?.()}
  {/snippet}
</ControlAppBar>
