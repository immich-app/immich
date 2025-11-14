import { goto } from '$app/navigation';
import { eventManager } from '$lib/managers/event-manager.svelte';
import LibraryExclusionPatternAddModal from '$lib/modals/LibraryExclusionPatternAddModal.svelte';
import LibraryExclusionPatternEditModal from '$lib/modals/LibraryExclusionPatternEditModal.svelte';
import LibraryImportPathAddModal from '$lib/modals/LibraryImportPathAddModal.svelte';
import LibraryImportPathEditModal from '$lib/modals/LibraryImportPathEditModal.svelte';
import LibraryEditModal from '$lib/modals/LibraryRenameModal.svelte';
import LibraryUserPickerModal from '$lib/modals/LibraryUserPickerModal.svelte';
import type { ActionItem } from '$lib/types';
import { handleError } from '$lib/utils/handle-error';
import { getFormatter } from '$lib/utils/i18n';
import {
  createLibrary,
  deleteLibrary,
  JobCommand,
  JobName,
  sendJobCommand,
  updateLibrary,
  type LibraryResponseDto,
} from '@immich/sdk';
import { modalManager, toastManager } from '@immich/ui';
import { mdiEyeOutline, mdiPencilOutline, mdiPlusBoxOutline, mdiSync, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';

export const getLibrariesActions = ($t: MessageFormatter) => {
  const ScanAll: ActionItem = {
    title: $t('scan_all_libraries'),
    icon: mdiSync,
    onSelect: () => handleScanAllLibraries(),
  };

  const Create: ActionItem = {
    title: $t('create_library'),
    icon: mdiPlusBoxOutline,
    onSelect: () => handleLibraryCreate(),
  };

  return { ScanAll, Create };
};

export const getLibraryActions = ($t: MessageFormatter, library: LibraryResponseDto) => {
  const View: ActionItem = {
    icon: mdiEyeOutline,
    title: $t('view'),
    onSelect: () => void goto(`/admin/library-management/${library.id}`),
  };

  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onSelect: () => modalManager.show(LibraryEditModal, { library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    onSelect: () => handleLibraryDelete(library),
  };

  const AddImportPath: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onSelect: () => modalManager.show(LibraryImportPathAddModal, { library }),
  };

  const AddExclusionPattern: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onSelect: () => modalManager.show(LibraryExclusionPatternAddModal, { library }),
  };

  return { View, Edit, Delete, AddImportPath, AddExclusionPattern };
};

export const getLibraryImportPathActions = ($t: MessageFormatter, library: LibraryResponseDto, importPath: string) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onSelect: () => modalManager.show(LibraryImportPathEditModal, { importPath, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    onSelect: () => handleDeleteImportPath(library, importPath),
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
    onSelect: () => modalManager.show(LibraryExclusionPatternEditModal, { exclusionPattern, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    onSelect: () => handleDeleteExclusionPattern(library, exclusionPattern),
  };

  return { Edit, Delete };
};

const handleScanAllLibraries = async () => {
  const $t = await getFormatter();

  try {
    await sendJobCommand({ id: JobName.Library, jobCommandDto: { command: JobCommand.Start } });
    toastManager.info($t('admin.refreshing_all_libraries'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_scan_libraries'));
  }
};

export const handleLibraryCreate = async () => {
  const $t = await getFormatter();

  const ownerId = await modalManager.show(LibraryUserPickerModal);
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

export const handleLibraryRename = async (library: LibraryResponseDto, name: string) => {
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

const handleLibraryDelete = async (library: LibraryResponseDto) => {
  const $t = await getFormatter();

  const confirmed = modalManager.showDialog({ prompt: $t('admin.confirm_delete_library') });

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

export const handleAddImportPath = async (library: LibraryResponseDto, importPath: string) => {
  const $t = await getFormatter();

  if (library.importPaths.includes(importPath)) {
    toastManager.danger($t('errors.import_path_already_exists'));
    return false;
  }

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { importPaths: [...library.importPaths, importPath] },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_import_path_added'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

export const handleEditImportPath = async (
  library: LibraryResponseDto,
  oldImportPath: string,
  newImportPath: string,
) => {
  const $t = await getFormatter();

  if (oldImportPath === newImportPath) {
    return true;
  }

  const importPaths = library.importPaths.map((path) => (path === oldImportPath ? newImportPath : path));

  try {
    const updatedLibrary = await updateLibrary({ id: library.id, updateLibraryDto: { importPaths } });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_import_path_edited'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

const handleDeleteImportPath = async (library: LibraryResponseDto, importPath: string) => {
  const $t = await getFormatter();

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: { importPaths: library.importPaths.filter((path) => path !== importPath) },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_import_path_deleted'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

export const handleAddExclusionPattern = async (library: LibraryResponseDto, exclusionPattern: string) => {
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
    toastManager.success($t('admin.library_exclusion_pattern_added'));
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
    toastManager.success($t('admin.library_exclusion_pattern_edited'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};

const handleDeleteExclusionPattern = async (library: LibraryResponseDto, exclusionPattern: string) => {
  const $t = await getFormatter();

  try {
    const updatedLibrary = await updateLibrary({
      id: library.id,
      updateLibraryDto: {
        exclusionPatterns: library.exclusionPatterns.filter((pattern) => pattern !== exclusionPattern),
      },
    });
    eventManager.emit('LibraryUpdate', updatedLibrary);
    toastManager.success($t('admin.library_exclusion_pattern_deleted'));
  } catch (error) {
    handleError(error, $t('errors.unable_to_update_library'));
    return false;
  }

  return true;
};
