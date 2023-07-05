import type { OnShowContextMenuDetail } from '$lib/components/library-page/library-card';
import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { LibraryResponseDto, LibraryType, api } from '@api';
import { derived, get, writable } from 'svelte/store';

type LibraryProps = { libraries: LibraryResponseDto[] };

export const useLibraries = (props: LibraryProps) => {
  const libraries = writable([...props.libraries]);
  const contextMenuPosition = writable<OnShowContextMenuDetail>({ x: 0, y: 0 });
  const contextMenuTargetLibrary = writable<LibraryResponseDto | undefined>();
  const isShowContextMenu = derived(contextMenuTargetLibrary, ($selectedLibrary) => !!$selectedLibrary);

  async function loadLibraries(): Promise<void> {
    try {
      const { data } = await api.libraryApi.getAllLibraries();
      libraries.set(data);
    } catch {
      notificationController.show({
        message: 'Error loading libraries',
        type: NotificationType.Error,
      });
    }
  }

  async function createUploadLibrary(): Promise<LibraryResponseDto | undefined> {
    return createLibrary(LibraryType.Upload);
  }

  async function createImportLibrary(): Promise<LibraryResponseDto | undefined> {
    return createLibrary(LibraryType.Import);
  }

  async function createLibrary(libraryType: LibraryType): Promise<LibraryResponseDto | undefined> {
    try {
      const { data: newLibrary } = await api.libraryApi.createLibrary({
        createLibraryDto: {
          name: 'Untitled',
          libraryType: libraryType,
        },
      });

      return newLibrary;
    } catch {
      notificationController.show({
        message: 'Error creating library',
        type: NotificationType.Error,
      });
    }
  }

  async function deleteLibrary(libraryToDelete: LibraryResponseDto): Promise<void> {
    // TODO
    // await api.albumApi.deleteAlbum({ id: albumToDelete.id });
    // albums.set(
    //   get(albums).filter(({ id }) => {
    //     return id !== albumToDelete.id;
    //   }),
    // );
  }

  async function showLibraryContextMenu(
    contextMenuDetail: OnShowContextMenuDetail,
    library: LibraryResponseDto,
  ): Promise<void> {
    contextMenuTargetLibrary.set(library);

    contextMenuPosition.set({
      x: contextMenuDetail.x,
      y: contextMenuDetail.y,
    });
  }

  function closeLibraryContextMenu() {
    contextMenuTargetLibrary.set(undefined);
  }

  return {
    libraries,
    isShowContextMenu,
    contextMenuPosition,
    contextMenuTargetLibrary,
    loadLibraries,
    createUploadLibrary,
    createImportLibrary,
    deleteLibrary,
    showLibraryContextMenu,
    closeLibraryContextMenu,
  };
};
