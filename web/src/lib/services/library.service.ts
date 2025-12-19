import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import LibraryExclusionPatternAddModal from '$lib/modals/LibraryExclusionPatternAddModal.svelte';
import LibraryExclusionPatternEditModal from '$lib/modals/LibraryExclusionPatternEditModal.svelte';
import LibraryFolderAddModal from '$lib/modals/LibraryFolderAddModal.svelte';
import LibraryFolderEditModal from '$lib/modals/LibraryFolderEditModal.svelte';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createLibrary,
  deleteLibrary,
  QueueCommand,
  QueueName,
  runQueueCommandLegacy,
  scanLibrary,
  updateLibrary,
  type CreateLibraryDto,
  type LibraryResponseDto,
  type UpdateLibraryDto,
} from '@immich/sdk';
import { modalManager, toastManager, type ActionItem } from '@immich/ui';
import { mdiPencilOutline, mdiPlusBoxOutline, mdiSync, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getLibrariesActions = ($t: MessageFormatter, libraries: LibraryResponseDto[]) => {
  const ScanAll: ActionItem = {
    title: $t('scan_all_libraries'),
    type: $t('command'),
    icon: mdiSync,
    onAction: () => handleScanAllLibraries(),
    shortcuts: { shift: true, key: 'r' },
    $if: () => libraries.length > 0,
  };

  const Create: ActionItem = {
    title: $t('create_library'),
    type: $t('command'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(AppRoute.ADMIN_LIBRARIES_NEW),
    shortcuts: { shift: true, key: 'n' },
  };

  return { ScanAll, Create };
};

export const getLibraryActions = ($t: MessageFormatter, library: LibraryResponseDto) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    type: $t('command'),
    title: $t('edit'),
    onAction: () => goto(`${AppRoute.ADMIN_LIBRARIES}/${library.id}/edit`),
    shortcuts: { key: 'r' },
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    type: $t('command'),
    title: $t('delete'),
    color: 'danger',
    onAction: () => handleDeleteLibrary(library),
    shortcuts: { key: 'Backspace' },
  };

  const AddFolder: ActionItem = {
    icon: mdiPlusBoxOutline,
    type: $t('command'),
    title: $t('add'),
    onAction: () => modalManager.show(LibraryFolderAddModal, { library }),
  };

  const AddExclusionPattern: ActionItem = {
    icon: mdiPlusBoxOutline,
    type: $t('command'),
    title: $t('add'),
    onAction: () => modalManager.show(LibraryExclusionPatternAddModal, { library }),
  };

  const Scan: ActionItem = {
    icon: mdiSync,
    type: $t('command'),
    title: $t('scan_library'),
    onAction: () => handleScanLibrary(library),
    shortcuts: { shift: true, key: 'r' },
  };

  return { Edit, Delete, AddFolder, AddExclusionPattern, Scan };
};

export const getLibraryFolderActions = ($t: MessageFormatter, library: LibraryResponseDto, folder: string) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    type: $t('command'),
    title: $t('edit'),
    onAction: () => modalManager.show(LibraryFolderEditModal, { folder, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    type: $t('command'),
    title: $t('delete'),
    onAction: () => handleDeleteLibraryFolder(library, folder),
  };

  return { Edit, Delete };
};

export const getLibraryExclusionPatternActions = (
  $t: MessageFormatter,
  library: LibraryResponseDto,
  exclusionPattern: string,
) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    type: $t('command'),
    title: $t('edit'),
    onAction: () => modalManager.show(LibraryExclusionPatternEditModal, { exclusionPattern, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    type: $t('command'),
    title: $t('delete'),
    onAction: () => handleDeleteExclusionPattern(library, exclusionPattern),
  };

  return { Edit, Delete };
};

const handleScanAllLibraries = async () => {
  const $t = await getFormatter();

  try {
    await runQueueCommandLegacy({ name: QueueName.Library, queueCommandDto: { command: QueueCommand.Start } });
    toastManager.info($t('admin.refreshing_all_libraries'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_scan_libraries'));
  }
};

const handleScanLibrary = async (library: LibraryResponseDto) => {
  const $t = await getFormatter();
  try {
    await scanLibrary({ id: library.id });
    toastManager.info($t('admin.scanning_library'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_scan_library'));
  }
};

export const handleViewLibrary = async (library: LibraryResponseDto) => {
  await goto(`${AppRoute.ADMIN_LIBRARIES}/${library.id}`);
};

export const handleCreateLibrary = async (dto: CreateLibraryDto) => {
  const $t = await getFormatter();

  try {
    const library = await createLibrary({ createLibraryDto: dto });
    eventManager.emit('LibraryCreate', library);
    toastManager.success($t('admin.library_created', { values: { library: library.name } }));
    return library;
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_library'));
  }
};

export const handleUpdateLibrary = async (library: LibraryResponseDto, dto: UpdateLibraryDto) => {
  const $t = await getFormatter();

  try {
    const updatedLibrary = await updateLibrary({ id: library.id, updateLibraryDto: dto });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
    return true;
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }
};

const handleDeleteLibrary = async (library: LibraryResponseDto) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    prompt: $t('admin.confirm_delete_library', { values: { library: library.name } }),
  });

  if (!confirmed) {
    return;
  }

  if (library.assetCount > 0) {
    const isConfirmed = await modalManager.showDialog({
      prompt: $t('admin.confirm_delete_library_assets', { values: { count: library.assetCount } }),
    });
    if (!isConfirmed) {
      return;
    }
  }

  try {
    await deleteLibrary({ id: library.id });
    eventManager.emit('LibraryDelete', { id: library.id });
    toastManager.success($t('admin.library_deleted'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_remove_library'));
  }
};

export const handleAddLibraryFolder = async (library: LibraryResponseDto, folder: string) => {
  const $t = await getFormatter();

  if (library.importPaths.includes(folder)) {
    toastManager.danger($t('errors.library_folder_already_exists'));
    return false;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { importPaths: [...library.importPaths, folder] },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

export const handleEditLibraryFolder = async (library: LibraryResponseDto, oldFolder: string, newFolder: string) => {
  const $t = await getFormatter();

  if (oldFolder === newFolder) {
    return true;
  }

  const importPaths = library.importPaths.map((path) => (path === oldFolder ? newFolder : path));

  try {
    const updatedLibrary = await updateLibrary({ id: library.id, updateLibraryDto: { importPaths } });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

const handleDeleteLibraryFolder = async (library: LibraryResponseDto, folder: string) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({
    prompt: $t('admin.library_remove_folder_prompt'),
    confirmText: $t('remove'),
  });

  if (!confirmed) {
    return;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { importPaths: library.importPaths.filter((path) => path !== folder) },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
  }
};

export const handleAddLibraryExclusionPattern = async (library: LibraryResponseDto, exclusionPattern: string) => {
  const $t = await getFormatter();

  if (library.exclusionPatterns.includes(exclusionPattern)) {
    toastManager.danger($t('errors.exclusion_pattern_already_exists'));
    return false;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { exclusionPatterns: [...library.exclusionPatterns, exclusionPattern] },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

export const handleEditExclusionPattern = async (
  library: LibraryResponseDto,
  oldExclusionPattern: string,
  newExclusionPattern: string,
) => {
  const $t = await getFormatter();

  if (oldExclusionPattern === newExclusionPattern) {
    return true;
  }

  const exclusionPatterns = library.exclusionPatterns.map((pattern) =>
    pattern === oldExclusionPattern ? newExclusionPattern : pattern,
  );

  try {
    const updatedLibrary = await updateLibrary({ id: library.id, updateLibraryDto: { exclusionPatterns } });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

const handleDeleteExclusionPattern = async (library: LibraryResponseDto, exclusionPattern: string) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('admin.library_remove_exclusion_pattern_prompt') });
  if (!confirmed) {
    return;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: {
        exclusionPatterns: library.exclusionPatterns.filter((pattern) => pattern !== exclusionPattern),
      },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
  }
};
