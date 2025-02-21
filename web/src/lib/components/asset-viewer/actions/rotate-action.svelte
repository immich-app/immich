<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction, ExifOrientation } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { mdiRotateLeft, mdiRotateRight } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';
  import {
    notificationController,
    NotificationType,
  } from '$lib/components/shared-components/notification/notification';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
    counterclockwise?: boolean;
    menuItem?: boolean;
  }

  let { asset, onAction, counterclockwise = false, menuItem }: Props = $props();

  const icon = $derived(counterclockwise ? mdiRotateLeft : mdiRotateRight);
  const text = $derived(counterclockwise ? $t('rotate_left') : $t('rotate_right'));

  const getNextOrientation = (current: number) => {
    switch (current) {
      case -1:
      case 0:
      case ExifOrientation.Horizontal: {
        return ExifOrientation.Rotate90CW;
      }
      case ExifOrientation.Rotate90CW: {
        return ExifOrientation.Rotate180;
      }
      case ExifOrientation.Rotate180: {
        return ExifOrientation.Rotate270CW;
      }
      case ExifOrientation.Rotate270CW: {
        return ExifOrientation.Horizontal;
      }
      case ExifOrientation.MirrorHorizontal: {
        return ExifOrientation.MirrorHorizontalRotate90CW;
      }
      case ExifOrientation.MirrorHorizontalRotate90CW: {
        return ExifOrientation.MirrorVertical;
      }
      case ExifOrientation.MirrorVertical: {
        return ExifOrientation.MirrorHorizontalRotate270CW;
      }
      case ExifOrientation.MirrorHorizontalRotate270CW: {
        return ExifOrientation.MirrorVertical;
      }
      default: {
        return current;
      }
    }
  };

  const handleRotate = async () => {
    if (!asset.exifInfo?.orientation) {
      return;
    }

    const current = Number(asset.exifInfo.orientation);
    if (Number.isNaN(current)) {
      return;
    }

    const orientation = counterclockwise
      ? getNextOrientation(getNextOrientation(getNextOrientation(current)))
      : getNextOrientation(current);

    try {
      const data = await updateAsset({ id: asset.id, updateAssetDto: { orientation } });

      // TODO: remove if/when there is immediate UI feedback on image rotation (css animation)
      notificationController.show({ message: text, type: NotificationType.Info });

      onAction({ type: AssetAction.ROTATE, asset: data, counterclockwise });
    } catch (error) {
      handleError(error, $t('errors.unable_to_rotate_image'));
    }
  };
</script>

<svelte:window use:shortcut={{ shortcut: { key: 'r', shift: counterclockwise }, onShortcut: handleRotate }} />

{#if menuItem}
  <MenuOption {icon} onClick={handleRotate} {text} />
{:else}
  <CircleIconButton
    color="opaque"
    icon={counterclockwise ? mdiRotateLeft : mdiRotateRight}
    title={text}
    onclick={handleRotate}
  />
{/if}
