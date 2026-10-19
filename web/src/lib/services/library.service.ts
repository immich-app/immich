import type { LibraryResponseDto } from '@immich/sdk';
import { modalManager, type ActionItem } from '@immich/ui';
import { mdiInformationOutline, mdiPencilOutline, mdiPlusBoxOutline, mdiSync, mdiTrashCanOutline } from '@mdi/js';
import type { MessageFormatter } from 'svelte-i18n';
import { goto } from '$app/navigation';
import LibraryExclusionPatternAddModal from '$lib/modals/LibraryExclusionPatternAddModal.svelte';
import LibraryExclusionPatternEditModal from '$lib/modals/LibraryExclusionPatternEditModal.svelte';
import LibraryFolderAddModal from '$lib/modals/LibraryFolderAddModal.svelte';
import LibraryFolderEditModal from '$lib/modals/LibraryFolderEditModal.svelte';
import { executeMutation } from '$lib/queries/client';
import { deleteLibraryMutation, scanLibraryMutation, updateLibraryMutation } from '$lib/queries/library.query';
import { scanAllLibrariesMutation } from '$lib/queries/queue.query';
import { Route } from '$lib/route';
import { getFormatter } from '$lib/utils/i18n';

export const getLibrariesActions = ($t: MessageFormatter) => {
  const ScanAll: ActionItem = {
    title: $t('scan_all_libraries'),
    icon: mdiSync,
    onAction: () => executeMutation(scanAllLibrariesMutation),
    shortcuts: { shift: true, key: 'r' },
  };

  const Create: ActionItem = {
    title: $t('create_library'),
    icon: mdiPlusBoxOutline,
    onAction: () => goto(Route.newLibrary()),
    shortcuts: { shift: true, key: 'n' },
  };

  return { ScanAll, Create };
};

export const getLibraryActions = ($t: MessageFormatter, library: LibraryResponseDto) => {
  const Detail: ActionItem = {
    icon: mdiInformationOutline,
    title: $t('details'),
    onAction: () => goto(Route.viewLibrary(library)),
  };

  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => goto(Route.editLibrary(library)),
    shortcuts: { key: 'r' },
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    color: 'danger',
    onAction: () => handleDeleteLibrary(library),
    shortcuts: { key: 'Backspace' },
    shortcutOptions: { ignoreInputFields: true },
  };

  const AddFolder: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onAction: () => modalManager.show(LibraryFolderAddModal, { library }),
  };

  const AddExclusionPattern: ActionItem = {
    icon: mdiPlusBoxOutline,
    title: $t('add'),
    onAction: () => modalManager.show(LibraryExclusionPatternAddModal, { library }),
  };

  const Scan: ActionItem = {
    icon: mdiSync,
    title: $t('scan_library'),
    onAction: () => executeMutation(scanLibraryMutation, [{ id: library.id }]),
    shortcuts: { shift: true, key: 'r' },
  };

  return { Detail, Edit, Delete, AddFolder, AddExclusionPattern, Scan };
};

export const getLibraryFolderActions = ($t: MessageFormatter, library: LibraryResponseDto, folder: string) => {
  const Edit: ActionItem = {
    icon: mdiPencilOutline,
    title: $t('edit'),
    onAction: () => modalManager.show(LibraryFolderEditModal, { folder, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
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
    title: $t('edit'),
    onAction: () => modalManager.show(LibraryExclusionPatternEditModal, { exclusionPattern, library }),
  };

  const Delete: ActionItem = {
    icon: mdiTrashCanOutline,
    title: $t('delete'),
    onAction: () => handleDeleteExclusionPattern(library, exclusionPattern),
  };

  return { Edit, Delete };
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

  await executeMutation(deleteLibraryMutation, [{ id: library.id }], {
    onSuccess: () => void goto(Route.libraries()),
  });
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

  const importPaths = library.importPaths.filter((path) => path !== folder);
  await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { importPaths } }]);
};

const handleDeleteExclusionPattern = async (library: LibraryResponseDto, exclusionPattern: string) => {
  const $t = await getFormatter();

  const confirmed = await modalManager.showDialog({ prompt: $t('admin.library_remove_exclusion_pattern_prompt') });
  if (!confirmed) {
    return;
  }

  const exclusionPatterns = library.exclusionPatterns.filter((pattern) => pattern !== exclusionPattern);
  await executeMutation(updateLibraryMutation, [{ id: library.id, updateLibraryDto: { exclusionPatterns } }]);
};
