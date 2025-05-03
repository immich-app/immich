<script lang="ts">
  import { page } from '$app/state';
  import { shouldIgnoreEvent } from '$lib/actions/shortcut';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { isAlbumsRoute } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';

  let albumId = $derived(isAlbumsRoute(page.route?.id) ? page.params.albumId : undefined);

  let dragStartTarget: EventTarget | null = $state(null);

  const onDragEnter = (e: DragEvent) => {
    if (e.dataTransfer && e.dataTransfer.types.includes('Files')) {
      dragStartTarget = e.target;
    }
  };

  const onDragLeave = (e: DragEvent) => {
    if (dragStartTarget === e.target) {
      dragStartTarget = null;
    }
  };

  const onDrop = async (e: DragEvent) => {
    dragStartTarget = null;
    await handleDataTransfer(e.dataTransfer);
  };

  const onPaste = (event: ClipboardEvent) => {
    if (shouldIgnoreEvent(event)) {
      return;
    }

    return handleDataTransfer(event.clipboardData);
  };

  const handleDataTransfer = async (dataTransfer?: DataTransfer | null) => {
    if (!dataTransfer) {
      return;
    }

    if (!browserSupportsDirectoryUpload()) {
      return handleFiles(dataTransfer.files);
    }

    const entries: FileSystemEntry[] = [];
    const files: File[] = [];
    for (const item of dataTransfer.items) {
      const entry = item.webkitGetAsEntry();
      if (entry) {
        entries.push(entry);
        continue;
      }

      const file = item.getAsFile();
      if (file) {
        files.push(file);
      }
    }

    const directoryFiles = await getAllFilesFromTransferEntries(entries);
    return handleFiles([...files, ...directoryFiles]);
  };

  const browserSupportsDirectoryUpload = () => typeof DataTransferItem.prototype.webkitGetAsEntry === 'function';

  const getAllFilesFromTransferEntries = async (transferEntries: FileSystemEntry[]): Promise<File[]> => {
    const allFiles: File[] = [];
    let entriesToCheckForSubDirectories = [...transferEntries];
    while (entriesToCheckForSubDirectories.length > 0) {
      const currentEntry = entriesToCheckForSubDirectories.pop();

      if (isFileSystemDirectoryEntry(currentEntry)) {
        entriesToCheckForSubDirectories = entriesToCheckForSubDirectories.concat(
          await getContentsFromFileSystemDirectoryEntry(currentEntry),
        );
      } else if (isFileSystemFileEntry(currentEntry)) {
        allFiles.push(await getFileFromFileSystemEntry(currentEntry));
      }
    }

    return allFiles;
  };

  const isFileSystemDirectoryEntry = (entry?: FileSystemEntry): entry is FileSystemDirectoryEntry =>
    !!entry && entry.isDirectory;
  const isFileSystemFileEntry = (entry?: FileSystemEntry): entry is FileSystemFileEntry => !!entry && entry.isFile;

  const getFileFromFileSystemEntry = async (fileSystemFileEntry: FileSystemFileEntry): Promise<File> => {
    return new Promise((resolve, reject) => {
      fileSystemFileEntry.file(resolve, reject);
    });
  };

  const readEntriesAsync = (reader: FileSystemDirectoryReader) => {
    return new Promise<FileSystemEntry[]>((resolve, reject) => {
      reader.readEntries(resolve, reject);
    });
  };

  const getContentsFromFileSystemDirectoryEntry = async (
    fileSystemDirectoryEntry: FileSystemDirectoryEntry,
  ): Promise<FileSystemEntry[]> => {
    const reader = fileSystemDirectoryEntry.createReader();
    const files: FileSystemEntry[] = [];
    let entries: FileSystemEntry[];

    do {
      entries = await readEntriesAsync(reader);
      files.push(...entries);
    } while (entries.length > 0);

    return files;
  };

  const handleFiles = async (files?: FileList | File[]) => {
    if (!files) {
      return;
    }

    const filesArray: File[] = Array.from<File>(files);
    if (authManager.key) {
      dragAndDropFilesStore.set({ isDragging: true, files: filesArray });
    } else {
      await fileUploadHandler(filesArray, albumId);
    }
  };

  const ondragenter = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragEnter(e);
  };

  const ondragleave = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDragLeave(e);
  };

  const ondrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await onDrop(e);
  };

  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
</script>

<svelte:window onpaste={onPaste} />

<svelte:body {ondragenter} {ondragleave} {ondrop} />

{#if dragStartTarget}
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div
    class="fixed inset-0 z-[1000] flex h-full w-full flex-col items-center justify-center bg-gray-100/90 text-immich-dark-gray dark:bg-immich-dark-bg/90 dark:text-immich-gray"
    transition:fade={{ duration: 250 }}
    ondragover={onDragOver}
  >
    <ImmichLogo noText class="m-16 h-48 animate-bounce" />
    <div class="text-2xl">{$t('drop_files_to_upload')}</div>
  </div>
{/if}
