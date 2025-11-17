<script lang="ts">
  import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAlbumInfo, type AlbumResponseDto, type AssetResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { mdiImageOutline } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    album: AlbumResponseDto;
  }

  let { asset, album }: Props = $props();

  const handleUpdateThumbnail = async () => {
    try {
      await updateAlbumInfo({
        id: album.id,
        updateAlbumDto: {
          albumThumbnailAssetId: asset.id,
        },
      });
      toastManager.success($t('album_cover_updated'));
    } catch (error) {
      handleError(error, $t('errors.unable_to_update_album_cover'));
    }
  };
</script>

<MenuOption text={$t('set_as_album_cover')} icon={mdiImageOutline} onClick={handleUpdateThumbnail} />
