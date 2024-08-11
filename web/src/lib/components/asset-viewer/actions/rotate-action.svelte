<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetJobName, runAssetJobs, updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';
  import { photoViewer } from '$lib/stores/assets.store';

  export let asset: AssetResponseDto;
  export let onAction: OnAction;
  export let onSetRotation: (rotation: number) => void;
  export let to: 'left' | 'right';

  let angle = 0;

  const handleRotateAsset = async () => {
    let newOrientation = '1';
    try {
      switch (asset.exifInfo?.orientation) {
        case '0':
        case '1': {
          newOrientation = to === 'left' ? '8' : '6';
          break;
        }
        case '2': {
          newOrientation = to === 'left' ? '5' : '7';
          break;
        }
        case '3': {
          newOrientation = to === 'left' ? '6' : '8';
          break;
        }
        case '4': {
          newOrientation = to === 'left' ? '7' : '5';
          break;
        }
        case '5': {
          newOrientation = to === 'left' ? '4' : '2';
          break;
        }
        case '6': {
          newOrientation = to === 'left' ? '1' : '3';
          break;
        }
        case '7': {
          newOrientation = to === 'left' ? '2' : '4';
          break;
        }
        case '8': {
          newOrientation = to === 'left' ? '3' : '1';
          break;
        }
      }
      await updateAsset({ id: asset.id, updateAssetDto: { orientation: newOrientation } });
      asset.exifInfo = { ...asset.exifInfo, orientation: newOrientation };
      await runAssetJobs({ assetJobsDto: { assetIds: [asset.id], name: AssetJobName.RegenerateThumbnail } });
      notificationController.show({
        type: NotificationType.Info,
        message: $t('edited_asset'),
      });

      onAction({ type: AssetAction.ROTATE, asset });
      angle += to === 'left' ? -90 : 90;
      setTimeout(() => {
        // force the image to refresh the thumbnail
        const oldSrc = new URL($photoViewer!.src);
        oldSrc.searchParams.set('t', Date.now().toString());
        $photoViewer!.src = oldSrc.toString();
      }, 500);
    } catch (error) {
      handleError(error, $t('errors.unable_to_edit_asset'));
    }
  };
</script>

<MenuOption
  icon={to === 'left' ? mdiRotateLeft : mdiRotateRight}
  onClick={handleRotateAsset}
  text={$t(`rotate_${to}`)}
/>
