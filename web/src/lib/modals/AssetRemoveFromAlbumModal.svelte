<script lang="ts">
  import AlbumPickerModal from '$lib/modals/AlbumPickerModal.svelte';
  import { removeAssetFromAlbum, type AlbumResponseDto } from '@immich/sdk';
  import { toastManager } from '@immich/ui';
  import { handleError } from '$lib/utils/handle-error';
  import { t } from 'svelte-i18n';

  type Props = {
    assetIds: string[];
    onClose: (albumIds: string[]) => void;
  };

  const { assetIds, onClose }: Props = $props();

  const handleClose = async (albums?: AlbumResponseDto[]) => {
    if (!albums?.length) return onClose([]);
    try {
      const albumIds = albums.map(({ id }) => id);
      let res;
      for (const id of albumIds) {
        res = await removeAssetFromAlbum({ id, bulkIdsDto: { ids: assetIds } });
      }
      const count = res.filter(({ success }) => success).length;
      toastManager.primary($t('assets_removed_count', { values: { count } }));
      onClose(albumIds);
    } catch (e) {
      handleError(e, $t('errors.error_removing_assets_from_album'));
    }
  };
  //TODO Only show albums that any selected item is in as option in AlbumPickerModal
</script>

<AlbumPickerModal remove onClose={handleClose} />
