import { goto } from '$app/navigation';
import { AppRoute } from '$lib/constants';
import { eventManager } from '$lib/managers/event-manager.svelte';
import LibraryExclusionPatternAddModal from '$lib/modals/LibraryExclusionPatternAddModal.svelte';
import LibraryExclusionPatternEditModal from '$lib/modals/LibraryExclusionPatternEditModal.svelte';
import LibraryFolderAddModal from '$lib/modals/LibraryFolderAddModal.svelte';
import LibraryFolderEditModal from '$lib/modals/LibraryFolderEditModal.svelte';
import LibraryRenameModal from '$lib/modals/LibraryRenameModal.svelte';
import LibraryUserPickerModal from '$lib/modals/LibraryUserPickerModal.svelte';
import type { ActionItem } from '$lib/types';
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
  type LibraryResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { mdiPencilOutline, mdiPlusBoxOutline, mdiSync, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getLibrariesActions = ($t: MessageFormatter) => {
  const ScanAll: ActionItem = {
    title: $t('scan_all_libraries'),
    icon: mdiSync,
    onSelect: () => void handleScanAllLibraries(),
  };

  const Create: ActionItem = {
    title: $t('create_library'),
    icon: mdiPlusBoxOutline,
    onSelect: () => void handleCreateLibrary(),
  };

  return { ScanAll, Create };
};

export const getLibraryActions = ($t: MessageFormatter, library: LibraryResponseDto) => {
  const Rename: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('rename'),
    onSelect: () => void modalManager.show(LibraryRenameModal, { library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    onSelect: () => void handleDeleteLibrary(library),
  };

  const AddFolder: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onSelect: () => void modalManager.show(LibraryFolderAddModal, { library }),
  };

  const AddExclusionPattern: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onSelect: () => void modalManager.show(LibraryExclusionPatternAddModal, { library }),
  };

  const Scan: ActionItem = {
    icon: mdiSync,
    title: $t('scan_library'),
    onSelect: () => void handleScanLibrary(library),
  };

  return { Rename, Delete, AddFolder, AddExclusionPattern, Scan };
};

export const getLibraryFolderActions = ($t: MessageFormatter, library: LibraryResponseDto, folder: string) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onSelect: () => void modalManager.show(LibraryFolderEditModal, { folder, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    onSelect: () => void handleDeleteLibraryFolder(library, folder),
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
    title: $t('edit'),
    onSelect: () => void modalManager.show(LibraryExclusionPatternEditModal, { exclusionPattern, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    onSelect: () => void handleDeleteExclusionPattern(library, exclusionPattern),
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
  await goto(`${AppRoute.ADMIN_LIBRARY_MANAGEMENT}/${library.id}`);
};

export const handleCreateLibrary = async () => {
  const $t = await getFormatter();

  const ownerId = await modalManager.show(LibraryUserPickerModal, {});
  if (!ownerId) {
    return;
  }

  try {
    const createdLibrary = await createLibrary({ createLibraryDto: { ownerId } });
    eventManager.emit('LibraryCreate', createdLibrary);
    toastManager.success($t('admin.library_created', { values: { library: createdLibrary.name } }));
  } catch (error) {
    handleError(error, $t('errors.unable_to_create_library'));
  }
};

export const handleRenameLibrary = async (library: { id: string }, name?: string) => {
  const $t = await getFormatter();

  if (!name) {
    return false;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { name },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_updated'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
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
    return false;
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
    return false;
  }

  return true;
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
    return false;
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
    return false;
  }

  return true;
};
