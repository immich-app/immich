import { downloadArchive } from '$lib/utils/asset-utils';
import type { AlbumResponseDto } from '@immich/sdk';

export const handleDownloadAlbum = async (album: AlbumResponseDto) => {
  await downloadArchive(`${album.albumName}.zip`, { albumId: album.id });
};
