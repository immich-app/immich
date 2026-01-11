import { goto } from '$app/navigation';
import ToastAction from '$lib/components/ToastAction.svelte';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import AlbumShareModal from '$lib/modals/AlbumShareModal.svelte';
import { user } from '$lib/stores/user.store';
import { downloadArchive } from '$lib/utils/asset-utils';
import { openFileUploadDialog } from '$lib/utils/file-uploader';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  addAssetsToAlbum,
  addUsersToAlbum,
  deleteAlbum,
  updateAlbumInfo,
  type AlbumResponseDto,
  type AlbumUserAddDto,
  type UpdateAlbumDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPlusBoxOutline, mdiShareVariantOutline, mdiUpload } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getAlbumActions = ($t: MessageFormatter, album: AlbumResponseDto) => {
  const isOwned = get(user).id === album.ownerId;

  const Share: ActionItem = {
    title: $t('share'),
    type: $t('command'),
    icon: mdiShareVariantOutline,
    $if: () => isOwned,
    onAction: () => modalManager.show(AlbumShareModal, { album }),
  };

  return { Share };
};

export const getAlbumAssetsActions = ($t: MessageFormatter, album: AlbumResponseDto, assets: TimelineAsset[]) => {
  const AddAssets: ActionItem = {
    title: $t('add_assets'),
    type: $t('command'),
    icon: mdiPlusBoxOutline,
    $if: () => assets.length > 0,
    onAction: () => addAssets(album, assets),
  };

  const Upload: ActionItem = {
    title: $t('select_from_computer'),
    description: $t('album_upload_assets'),
    type: $t('command'),
    icon: mdiUpload,
    onAction: () => void openFileUploadDialog({ albumId: album.id }),
  };

  return { AddAssets, Upload };
};

const addAssets = async (album: AlbumResponseDto, assets: TimelineAsset[]) => {
  const $t = await getFormatter();
  const assetIds = assets.map(({ id }) => id);

  try {
    const results = await addAssetsToAlbum({ id: album.id, bulkIdsDto: { ids: assetIds } });

    const count = results.filter(({ success }) => success).length;
    toastManager.success($t('assets_added_count', { values: { count } }));
    eventManager.emit('AlbumAddAssets');
  } catch (error) {
    handleError(error, $t('errors.error_adding_assets_to_album'));
  }
};

export const handleAddUsersToAlbum = async (album: AlbumResponseDto, albumUsers: AlbumUserAddDto[]) => {
  const $t = await getFormatter();

  try {
    await addUsersToAlbum({ id: album.id, addUsersDto: { albumUsers } });
    eventManager.emit('AlbumShare');
    return true;
  } catch (error) {
    handleError(error, $t('errors.error_adding_users_to_album'));
  }

  return false;
};

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
