import { goto } from '$app/navigation';
import ToastAction from '$lib/components/ToastAction.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { eventManager } from '$lib/managers/event-manager.svelte';
import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
import AlbumAddUsersModal from '$lib/modals/AlbumAddUsersModal.svelte';
import AlbumOptionsModal from '$lib/modals/AlbumOptionsModal.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { Route } from '$lib/route';
import { user } from '$lib/stores/user.store';
import { createAlbumAndRedirect } from '$lib/utils/album-utils';
import { downloadArchive } from '$lib/utils/asset-utils';
import { openFileUploadDialog } from '$lib/utils/file-uploader';

import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  addAssetsToAlbum as addToAlbum,
  addAssetsToAlbums as addToAlbums,
  addUsersToAlbum,
  AlbumUserRole,
  BulkIdErrorReason,
  deleteAlbum,
  removeUserFromAlbum,
  updateAlbumInfo,
  updateAlbumUser,
  type AlbumResponseDto,
  type AlbumsAddAssetsResponseDto,
  type BulkIdResponseDto,
  type UpdateAlbumDto,
  type UserResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiLink, mdiPlus, mdiPlusBoxOutline, mdiShareVariantOutline, mdiUpload } from '@mdi/js';
import { type MessageFormatter } from 'svelte-i18n';
import { get } from 'svelte/store';

export const getAlbumsActions = ($t: MessageFormatter) => {
  const Create: ActionItem = {
    title: $t('create_album'),
    icon: mdiPlusBoxOutline,
    onAction: () => createAlbumAndRedirect(),
  };

  return { Create };
};

export const getAlbumActions = ($t: MessageFormatter, album: AlbumResponseDto) => {
  const isOwned = get(user).id === album.ownerId;

  const Share: ActionItem = {
    title: $t('share'),
    type: $t('command'),
    icon: mdiShareVariantOutline,
    $if: () => isOwned,
    onAction: () => modalManager.show(AlbumOptionsModal, { album }),
  };

  const AddUsers: ActionItem = {
    title: $t('invite_people'),
    type: $t('command'),
    icon: mdiPlus,
    color: 'primary',
    onAction: () => modalManager.show(AlbumAddUsersModal, { album }),
  };

  const CreateSharedLink: ActionItem = {
    title: $t('create_link'),
    type: $t('command'),
    icon: mdiLink,
    color: 'primary',
    onAction: () => modalManager.show(SharedLinkCreateModal, { albumId: album.id }),
  };

  return { Share, AddUsers, CreateSharedLink };
};

export const getAlbumAssetsActions = ($t: MessageFormatter, album: AlbumResponseDto, assets: TimelineAsset[]) => {
  const AddAssets: ActionItem = {
    title: $t('add_assets'),
    type: $t('command'),
    color: 'primary',
    icon: mdiPlusBoxOutline,
    $if: () => assets.length > 0,
    onAction: () =>
      addAssetsToAlbums(
        [album.id],
        assets.map(({ id }) => id),
        { notify: true },
      ).then(() => undefined),
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

export const addAssetsToAlbums = async (albumIds: string[], assetIds: string[], { notify }: { notify: boolean }) => {
  const $t = await getFormatter();

  try {
    if (albumIds.length === 1) {
      const albumId = albumIds[0];
      const results = await addToAlbum({ ...authManager.params, id: albumId, bulkIdsDto: { ids: assetIds } });
      if (notify) {
        notifyAddToAlbum($t, albumId, assetIds, results);
      }
    }

    if (albumIds.length > 1) {
      const results = await addToAlbums({ ...authManager.params, albumsAddAssetsDto: { albumIds, assetIds } });
      if (notify) {
        notifyAddToAlbums($t, albumIds, assetIds, results);
      }
    }

    eventManager.emit('AlbumAddAssets', { assetIds, albumIds });
    return true;
  } catch (error) {
    handleError(error, $t('errors.error_adding_assets_to_album'));
    return false;
  }
};

const notifyAddToAlbum = ($t: MessageFormatter, albumId: string, assetIds: string[], results: BulkIdResponseDto[]) => {
  const successCount = results.filter(({ success }) => success).length;
  const duplicateCount = results.filter(({ error }) => error === 'duplicate').length;
  let description = $t('assets_cannot_be_added_to_album_count', { values: { count: assetIds.length } });
  if (successCount > 0) {
    description = $t('assets_added_to_album_count', { values: { count: successCount } });
  } else if (duplicateCount > 0) {
    description = $t('assets_were_part_of_album_count', { values: { count: duplicateCount } });
  }

  toastManager.custom(
    {
      component: ToastAction,
      props: {
        title: $t('info'),
        color: 'primary',
        description,
        button: { text: $t('view_album'), color: 'primary', onClick: () => goto(Route.viewAlbum({ id: albumId })) },
      },
    },
    { timeout: 5000 },
  );
};

const notifyAddToAlbums = (
  $t: MessageFormatter,
  albumIds: string[],
  assetIds: string[],
  results: AlbumsAddAssetsResponseDto,
) => {
  if (results.error === BulkIdErrorReason.Duplicate) {
    toastManager.info($t('assets_were_part_of_albums_count', { values: { count: assetIds.length } }));
  } else if (results.error) {
    toastManager.warning($t('assets_cannot_be_added_to_albums', { values: { count: assetIds.length } }));
  } else {
    toastManager.success(
      $t('assets_added_to_albums_count', {
        values: { albumTotal: albumIds.length, assetTotal: assetIds.length },
      }),
    );
  }
};

export const handleUpdateUserAlbumRole = async ({
  albumId,
  userId,
  role,
}: {
  albumId: string;
  userId: string;
  role: AlbumUserRole;
}) => {
  const $t = await getFormatter();

  try {
    await updateAlbumUser({ id: albumId, userId, updateAlbumUserDto: { role } });
    eventManager.emit('AlbumUserUpdate', { albumId, userId, role });
  } catch (error) {
    handleError(error, $t('errors.unable_to_change_album_user_role'));
  }
};

export const handleAddUsersToAlbum = async (album: AlbumResponseDto, users: UserResponseDto[]) => {
  const $t = await getFormatter();

  try {
    await addUsersToAlbum({ id: album.id, addUsersDto: { albumUsers: users.map(({ id }) => ({ userId: id })) } });
    eventManager.emit('AlbumShare');
    return true;
  } catch (error) {
    handleError(error, $t('errors.error_adding_users_to_album'));
  }
};

export const handleRemoveUserFromAlbum = async (album: AlbumResponseDto, albumUser: UserResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    title: $t('album_remove_user'),
    prompt: $t('album_remove_user_confirmation', { values: { user: albumUser.name } }),
    confirmText: $t('remove_user'),
  });

  if (!confirmed) {
    return;
  }

  try {
    await removeUserFromAlbum({ id: album.id, userId: albumUser.id });
    eventManager.emit('AlbumUserDelete', { albumId: album.id, userId: albumUser.id });
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_album_users'));
  }
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
          onClick: () => goto(Route.viewAlbum({ id })),
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
