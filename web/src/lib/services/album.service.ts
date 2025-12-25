import { goto } from '$app/navigation';
import ToastAction from '$lib/components/ToastAction.svelte';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import { downloadArchive } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import { deleteAlbum, updateAlbumInfo, type AlbumResponseDto, type UpdateAlbumDto } from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';

export const handleUpdateAlbum = async ({ id }: { id: string }, dto: UpdateAlbumDto) => {
  const $t = await getFormatter();

  try {
    const response = await updateAlbumInfo({ id, updateAlbumDto: dto });
    eventManager.emit('AlbumUpdate', response);
    toastManager.custom({
      component: ToastAction,
      props: {
        color: 'primary',
        title: $t('success'),
        description: $t('album_info_updated'),
        button: {
          text: $t('view_album'),
          color: 'primary',
          onClick() {
            return goto(`${AppRoute.ALBUMS}/${id}`);
          },
        },
      },
    });

    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_album_info'));
  }
};

export const handleDeleteAlbum = async (album: AlbumResponseDto, options?: { prompt?: boolean; notify?: boolean }) => {
  const $t = await getFormatter();
  const { prompt = true, notify = true } = options ?? {};

  if (prompt) {
    const confirmation =
      album.albumName.length > 0
        ? $t('album_delete_confirmation', { values: { album: album.albumName } })
        : $t('unnamed_album_delete_confirmation');
    const description = $t('album_delete_confirmation_description');
    const success = await modalManager.showDialog({ prompt: `${confirmation} ${description}` });
    if (!success) {
      return false;
    }
  }

  try {
    await deleteAlbum({ id: album.id });
    eventManager.emit('AlbumDelete', album);
    if (notify) {
      toastManager.success();
    }
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_album'));
    return false;
  }
};

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
