import { downloadArchive } from '$lib/utils/asset-utils';
import { getFormatter } from '$lib/utils/i18n';
import type { AlbumResponseDto } from '@immich/sdk';
import { modalManager } from '@immich/ui';

export const handleDownloadAlbum = async (album: AlbumResponseDto) => {
  await downloadArchive(`${album.albumName}.zip`, { albumId: album.id });
};

export const handleConfirmAlbumDelete = async (album: AlbumResponseDto) => {
  const $t = await getFormatter();
  const confirmation =
    album.albumName.length > 0
      ? $t('album_delete_confirmation', { values: { album: album.albumName } })
      : $t('unnamed_album_delete_confirmation');

  const description = $t('album_delete_confirmation_description');
  const prompt = `${confirmation} ${description}`;

  return modalManager.showDialog({ prompt });
};
