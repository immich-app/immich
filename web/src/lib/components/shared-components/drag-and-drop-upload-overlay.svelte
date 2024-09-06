<script lang="ts">
  import { page } from '$app/stores';
  import { shouldIgnoreEvent } from '$lib/actions/shortcut';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { isAlbumsRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';

  $: albumId = isAlbumsRoute($page.route?.id) ? $page.params.albumId : undefined;
  $: isShare = isSharedLinkRoute($page.route?.id);

  let dragStartTarget: EventTarget | null = null;

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

  const getContentsFromFileSystemDirectoryEntry = async (
    fileSystemDirectoryEntry: FileSystemDirectoryEntry,
  ): Promise<FileSystemEntry[]> => {
    return new Promise((resolve, reject) => {
      const reader = fileSystemDirectoryEntry.createReader();
      reader.readEntries(resolve, reject);
    });
  };

  const handleFiles = async (files?: FileList | File[]) => {
    if (!files) {
      return;
    }

    const filesArray: File[] = Array.from<File>(files);
    if (isShare) {
      dragAndDropFilesStore.set({ isDragging: true, files: filesArray });
    } else {
      await fileUploadHandler(filesArray, albumId);
    }
  };
</script>

<svelte:window on:paste={onPaste} />

<svelte:body
  on:dragenter|stopPropagation|preventDefault={onDragEnter}
  on:dragleave|stopPropagation|preventDefault={onDragLeave}
  on:drop|stopPropagation|preventDefault={onDrop}
/>

{#if dragStartTarget}
  <!-- svelte-ignore a11y-no-static-element-interactions -->
  <div
    class="fixed inset-0 z-[1000] flex h-full w-full flex-col items-center justify-center bg-gray-100/90 text-immich-dark-gray dark:bg-immich-dark-bg/90 dark:text-immich-gray"
    transition:fade={{ duration: 250 }}
    on:dragover={(e) => {
      // Prevent browser from opening the dropped file.
      e.stopPropagation();
      e.preventDefault();
    }}
  >
    <ImmichLogo noText class="m-16 w-48 animate-bounce" />
    <div class="text-2xl">{$t('drop_files_to_upload')}</div>
  </div>
{/if}
