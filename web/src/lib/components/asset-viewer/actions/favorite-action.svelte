<script lang="ts">
  import { shortcut } from '$lib/actions/shortcut';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { IconButton, toastManager } from '@immich/ui';
  import { mdiHeart, mdiHeartOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    onAction: OnAction;
  }

  let { asset, onAction }: Props = $props();

  const toggleFavorite = async () => {
    try {
      const data = await updateAsset({
        id: asset.id,
        updateAssetDto: {
          isFavorite: !asset.isFavorite,
        },
      });

      asset = { ...asset, isFavorite: data.isFavorite };

      onAction({
        type: asset.isFavorite ? AssetAction.FAVORITE : AssetAction.UNFAVORITE,
        asset: toTimelineAsset(asset),
      });

      toastManager.success(asset.isFavorite ? $t('added_to_favorites') : $t('removed_from_favorites'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_add_remove_favorites', { values: { favorite: asset.isFavorite } }));
    }
  };
</script>

<svelte:document use:shortcut={{ shortcut: { key: 'f' }, onShortcut: toggleFavorite }} />

<IconButton
  color="secondary"
  shape="round"
  variant="ghost"
  icon={asset.isFavorite ? mdiHeart : mdiHeartOutline}
  aria-label={asset.isFavorite ? $t('unfavorite') : $t('to_favorite')}
  onclick={toggleFavorite}
/>
