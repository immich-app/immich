import type { OnShowContextMenuDetail } from '$lib/components/album-page/album-card';
import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { type AlbumResponseDto, api } from '@api';
import { derived, get, writable } from 'svelte/store';

type AlbumsProperties = { albums: AlbumResponseDto[] };

export const useAlbums = (properties: AlbumsProperties) => {
  const albums = writable([...properties.albums]);
  const contextMenuPosition = writable<OnShowContextMenuDetail>({ x: 0, y: 0 });
  const contextMenuTargetAlbum = writable<AlbumResponseDto | undefined>();
  const isShowContextMenu = derived(contextMenuTargetAlbum, ($selectedAlbum) => !!$selectedAlbum);

  async function loadAlbums(): Promise<void> {
    try {
      const { data } = await api.albumApi.getAllAlbums();
      albums.set(data);

      // Delete album that has no photos and is named ''
      for (const album of data) {
        if (album.albumName === '' && album.assetCount === 0) {
          setTimeout(async () => {
            await deleteAlbum(album);
          }, 500);
        }
      }
    } catch {
      notificationController.show({
        message: 'Error loading albums',
        type: NotificationType.Error,
      });
    }
  }

  async function createAlbum(): Promise<AlbumResponseDto | undefined> {
    try {
      const { data: newAlbum } = await api.albumApi.createAlbum({
        createAlbumDto: {
          albumName: '',
        },
      });

      return newAlbum;
    } catch {
      notificationController.show({
        message: 'Error creating album',
        type: NotificationType.Error,
      });
    }
  }

  async function deleteAlbum(albumToDelete: AlbumResponseDto): Promise<void> {
    await api.albumApi.deleteAlbum({ id: albumToDelete.id });
    albums.set(
      get(albums).filter(({ id }) => {
        return id !== albumToDelete.id;
      }),
    );
  }

  async function showAlbumContextMenu(
    contextMenuDetail: OnShowContextMenuDetail,
    album: AlbumResponseDto,
  ): Promise<void> {
    contextMenuTargetAlbum.set(album);

    contextMenuPosition.set({
      x: contextMenuDetail.x,
      y: contextMenuDetail.y,
    });
  }

  function closeAlbumContextMenu() {
    contextMenuTargetAlbum.set(undefined);
  }

  return {
    albums,
    isShowContextMenu,
    contextMenuPosition,
    contextMenuTargetAlbum,
    loadAlbums,
    createAlbum,
    deleteAlbum,
    showAlbumContextMenu,
    closeAlbumContextMenu,
  };
};
