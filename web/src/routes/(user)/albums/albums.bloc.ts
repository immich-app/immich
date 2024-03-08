import type { OnShowContextMenuDetail } from '$lib/components/album-page/album-card';
import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { asyncTimeout } from '$lib/utils';
import { handleError } from '$lib/utils/handle-error';
import { createAlbum, deleteAlbum, getAllAlbums, type AlbumResponseDto } from '@immich/sdk';
import { derived, get, writable } from 'svelte/store';

type AlbumsProperties = { albums: AlbumResponseDto[] };

export const useAlbums = (properties: AlbumsProperties) => {
  const albums = writable([...properties.albums]);
  const contextMenuPosition = writable<OnShowContextMenuDetail>({ x: 0, y: 0 });
  const contextMenuTargetAlbum = writable<AlbumResponseDto | undefined>();
  const isShowContextMenu = derived(contextMenuTargetAlbum, ($selectedAlbum) => !!$selectedAlbum);

  async function loadAlbums(): Promise<void> {
    try {
      const data = await getAllAlbums({});
      albums.set(data);

      // Delete album that has no photos and is named ''
      for (const album of data) {
        if (album.albumName === '' && album.assetCount === 0) {
          await asyncTimeout(500);
          await handleDeleteAlbum(album);
        }
      }
    } catch {
      notificationController.show({
        message: 'Error loading albums',
        type: NotificationType.Error,
      });
    }
  }

  async function handleCreateAlbum(): Promise<AlbumResponseDto | undefined> {
    try {
      return await createAlbum({ createAlbumDto: { albumName: '' } });
    } catch (error) {
      handleError(error, 'Unable to create album');
    }
  }

  async function handleDeleteAlbum(albumToDelete: AlbumResponseDto): Promise<void> {
    await deleteAlbum({ id: albumToDelete.id });
    albums.set(get(albums).filter(({ id }) => id !== albumToDelete.id));
  }

  function showAlbumContextMenu(contextMenuDetail: OnShowContextMenuDetail, album: AlbumResponseDto): void {
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
    createAlbum: handleCreateAlbum,
    deleteAlbum: handleDeleteAlbum,
    showAlbumContextMenu,
    closeAlbumContextMenu,
  };
};
