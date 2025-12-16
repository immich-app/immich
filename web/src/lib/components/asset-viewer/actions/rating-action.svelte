<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import { AssetAction } from '$lib/constants';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { asset, onAction }: Props = $props();

  const rateAsset = async (rating: number | null) => {
    try {
      const updateAssetDto = rating === null ? {} : { rating };

      await updateAsset({
        id: asset.id,
        updateAssetDto,
      });

      asset = {
        ...asset,
        exifInfo: {
          ...asset.exifInfo,
          rating,
        },
      };

      onAction({
        type: AssetAction.RATING,
        asset: toTimelineAsset(asset),
        rating,
      });

      if (rating === null) {
        toastManager.success($t('rating_clear'));
      } else {
        toastManager.success($t('rating_set', { values: { rating } }));
      }
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_rating'));
    }
  };

  const onShortcut0 = () => rateAsset(null);
  const onShortcut1 = () => rateAsset(1);
  const onShortcut2 = () => rateAsset(2);
  const onShortcut3 = () => rateAsset(3);
  const onShortcut4 = () => rateAsset(4);
  const onShortcut5 = () => rateAsset(5);
</script>

<svelte:document
  use:shortcuts={$preferences?.ratings.enabled
    ? [
        { shortcut: { key: '0' }, onShortcut: onShortcut0 },
        { shortcut: { key: '1' }, onShortcut: onShortcut1 },
        { shortcut: { key: '2' }, onShortcut: onShortcut2 },
        { shortcut: { key: '3' }, onShortcut: onShortcut3 },
        { shortcut: { key: '4' }, onShortcut: onShortcut4 },
        { shortcut: { key: '5' }, onShortcut: onShortcut5 },
      ]
    : []}
/>
