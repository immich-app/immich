import type { OnShowContextMenuDetail } from '$lib/components/library-page/library-card';
import { notificationController, NotificationType } from '$lib/components/shared-components/notification/notification';
import { LibraryResponseDto, api } from '@api';
import { derived, get, writable } from 'svelte/store';

type LibrariesProps = { libraries: LibraryResponseDto[] };

export const useLibraries = (props: LibrariesProps) => {
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

  async function createLibrary(): Promise<LibraryResponseDto | undefined> {
    try {
      const { data: newLibrary } = await api.libraryApi.createLibrary({
        createLibraryDto: {
          // TODO library type

          name: 'Untitled',
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
    createLibrary,
    showLibraryContextMenu,
    closeLibraryContextMenu,
  };
};
