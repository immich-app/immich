<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { AssetAction } from '$lib/constants';
  import { handleError } from '$lib/utils/handle-error';
  import { toTimelineAsset } from '$lib/utils/timeline-util';
  import { removeAssetFromAlbum, type AlbumResponseDto, type AssetResponseDto } from '@immich/sdk';
  import { modalManager, toastManager } from '@immich/ui';
  import { mdiImageRemoveOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';
  import type { OnAction } from './action';

  interface Props {
    asset: AssetResponseDto;
    album: AlbumResponseDto;
    onAction: OnAction;
  }

  let { asset, album, onAction }: Props = $props();

  const handleRemove = async () => {
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('remove_assets_album_confirmation', { values: { count: 1 } }),
    });
    if (!isConfirmed) return;

    try {
      await removeAssetFromAlbum({ id: album.id, bulkIdsDto: { ids: [asset.id] } });
      toastManager.success($t('assets_removed_count', { values: { count: 1 } }));
      onAction({ type: AssetAction.REMOVE_FROM_ALBUM, asset: toTimelineAsset(asset) });
    } catch (error) {
      handleError(error, $t('errors.error_removing_assets_from_album'));
    }
  };
</script>

<MenuOption text={$t('remove_from_album')} icon={mdiImageRemoveOutline} onClick={handleRemove} />
