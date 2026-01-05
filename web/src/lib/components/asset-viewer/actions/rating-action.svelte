<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import type { OnAction } from '$lib/components/asset-viewer/actions/action';
  import { AssetAction } from '$lib/constants';
  import { preferences } from '$lib/stores/user.store';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  type Props = {
    asset: AssetResponseDto;
    onAction: OnAction;
  };

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
    } catch (error) {
      handleError(error, $t('errors.unable_to_set_rating'));
    }
  };
</script>

<svelte:document
  use:shortcuts={$preferences?.ratings.enabled
    ? [
        { shortcut: { key: '0' }, onShortcut: () => rateAsset(null) },
        ...[1, 2, 3, 4, 5].map((rating) => ({
          shortcut: { key: String(rating) },
          onShortcut: () => rateAsset(rating),
        })),
      ]
    : []}
/>
