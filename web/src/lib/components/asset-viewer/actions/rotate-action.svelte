<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { AssetJobName, ExifOrientation, runAssetJobs, updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';
  import { photoViewer } from '$lib/stores/assets.store';

  export let asset: AssetResponseDto;
  export let onAction: OnAction;
  export let to: 'left' | 'right';

  const handleRotateAsset = async () => {
    // every rotation, in order
    // interleaved normal / mirrored
    const orientations = ['1', '2', '6', '7', '3', '4', '8', '5'];
    let index = orientations.indexOf(asset.exifInfo?.orientation ?? '1');
    if (index === -1) {
      index = 0;
    }
    index = (to === 'right' ? index + 2 : index - 2 + orientations.length) % orientations.length;
    const newOrientation = orientations[index] as ExifOrientation;
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { orientation: newOrientation } });
      asset.exifInfo = { ...asset.exifInfo, orientation: newOrientation };
      await runAssetJobs({ assetJobsDto: { assetIds: [asset.id], name: AssetJobName.RegenerateThumbnail } });
      notificationController.show({
        type: NotificationType.Info,
        message: $t('edited_asset'),
      });

      onAction({ type: AssetAction.ROTATE, asset });
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
  text={to === 'left' ? $t('rotate_left') : $t('rotate_right')}
/>
