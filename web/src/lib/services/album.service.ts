import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import ToastAction from '$lib/components/ToastAction.svelte';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import AlbumEditModal from '$lib/modals/AlbumEditModal.svelte';
import AlbumShareModal from '$lib/modals/AlbumShareModal.svelte';
import SharedLinkCreateModal from '$lib/modals/SharedLinkCreateModal.svelte';
import { downloadArchive } from '$lib/utils/asset-utils';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  addUsersToAlbum,
  deleteAlbum,
  updateAlbumInfo,
  type AlbumResponseDto,
  type AlbumUserAddDto,
  type UpdateAlbumDto,
} from '@immich/sdk';
import { MenuItemType, menuManager, modalManager, toastManager, type MenuItem } from '@immich/ui';
import { mdiDeleteOutline, mdiDotsVertical, mdiRenameOutline, mdiShareVariantOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getAlbumActions = ($t: MessageFormatter, album: AlbumResponseDto) => {
  return {
    Edit: {
      title: $t('edit_album'),
      icon: mdiRenameOutline,
      onSelect: () => void onEditAlbum(album),
    },
    Share: {
      title: $t('share'),
      icon: mdiShareVariantOutline,
      onSelect: () => void onShareAlbum(album),
    },
    Download: {
      title: $t('download'),
      icon: mdiShareVariantOutline,
      onSelect: () => void handleDownloadAlbum(album),
    },
    Delete: {
      title: $t('delete'),
      icon: mdiDeleteOutline,
      color: 'danger',
      onSelect: () => void handleDeleteAlbum(album),
    },
    ContextMenu: {
      title: $t('show_album_options'),
      icon: mdiDotsVertical,
      onSelect: ({ event }) => onOpenContextMenu(event as MouseEvent, album),
    },
  } satisfies Record<string, MenuItem>;
};

export const onOpenContextMenu = async (event: MouseEvent, album: AlbumResponseDto) => {
  event.stopPropagation();
  event.preventDefault();
  const { currentTarget, clientX, clientY } = event;

  const AlbumActions = getAlbumActions(await getFormatter(), album);

  await menuManager.show({ currentTarget, clientX, clientY } as MouseEvent, {
    items: [AlbumActions.Edit, AlbumActions.Share, AlbumActions.Download, MenuItemType.Divider, AlbumActions.Delete],
  });
};

export const handleDeleteAlbum = async (album: AlbumResponseDto, options?: { prompt?: boolean }) => {
  const $t = await getFormatter();
  const { prompt = true } = options ?? {};

  if (prompt) {
    const confirmation =
      album.albumName.length > 0
        ? $t('album_delete_confirmation', { values: { album: album.albumName } })
        : $t('unnamed_album_delete_confirmation');
    const description = $t('album_delete_confirmation_description');

    const isConfirmed = await modalManager.showDialog({ prompt: `${confirmation} ${description}` });
    if (!isConfirmed) {
      return false;
    }
  }

  try {
    await deleteAlbum({ id: album.id });
    eventManager.emit('album.delete', album);
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_delete_album'));
    return false;
  }
};

export const handleDownloadAlbum = async (album: AlbumResponseDto) => {
  await downloadArchive(`${album.albumName}.zip`, { albumId: album.id });
};

export const onShareAlbum = async (album: AlbumResponseDto) => {
  await modalManager.show(AlbumShareModal, { album });
};

export const handleAddAlbumUsers = async (album: AlbumResponseDto, albumUsers: AlbumUserAddDto[]) => {
  try {
    const newAlbum = await addUsersToAlbum({ id: album.id, addUsersDto: { albumUsers } });
    await eventManager.emit('album.update', newAlbum);
    return true;
  } catch (error) {
    const $t = await getFormatter();
    handleError(error, $t('errors.unable_to_add_album_users'));
    return false;
  }
};

export const handleCreateAlbumSharedLink = async (album: AlbumResponseDto) => {
  const sharedLink = await modalManager.show(SharedLinkCreateModal, { albumId: album.id });
  if (sharedLink) {
    album.shared = true;
    album.hasSharedLink = true;
    eventManager.emit('album.update', album);
    return true;
  }

  return false;
};

export const onEditAlbum = async (album: AlbumResponseDto) => {
  await modalManager.show(AlbumEditModal, { album });
};

export const handleEditAlbum = async (album: AlbumResponseDto, dto: UpdateAlbumDto) => {
  const $t = await getFormatter();

  try {
    const newAlbum = await updateAlbumInfo({ id: album.id, updateAlbumDto: dto });
    eventManager.emit('album.update', newAlbum);
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
            return goto(resolve(`${AppRoute.ALBUMS}/${album.id}`));
          },
        },
      },
    });

    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_album_info'));
    return false;
  }
};
