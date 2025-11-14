<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import {
    NotificationType,
    notificationController,
  } from '$lib/components/shared-components/notification/notification';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { getBaseUrl, type AssetResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiEye, mdiEyeOff } from '@mdi/js';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto & { isBlurred?: boolean };
    onAction: OnAction;
  }

  let { asset, onAction }: Props = $props();

  const toggleBlur = async () => {
    try {
      const response = await fetch(`${getBaseUrl()}/assets/${asset.id}/blur`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle blur');
      }

      const updatedAsset = await response.json();
      asset = { ...asset, isBlurred: updatedAsset.isBlurred };

      onAction({
        type: AssetAction.BLUR,
        asset: toTimelineAsset(asset),
      });

      notificationController.show({
        type: NotificationType.Info,
        message: asset.isBlurred ? 'Image blurred' : 'Image revealed',
      });
    } catch (error) {
      handleError(error, 'Unable to toggle blur');
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'b' }, onShortcut: toggleBlur }} />

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={asset.isBlurred ? mdiEyeOff : mdiEye}
  aria-label={asset.isBlurred ? 'Blurred image (click to reveal)' : 'Visible image (click to blur)'}
  onclick={toggleBlur}
/>
