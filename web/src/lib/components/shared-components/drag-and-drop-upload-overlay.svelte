<script lang="ts">
  import { fade } from 'svelte/transition';
  import ImmichLogo from './immich-logo.svelte';
  import { page } from '$app/stores';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler } from '$lib/utils/file-uploader';
  import { isAlbumsRoute, isSharedLinkRoute } from '$lib/utils/navigation';
  import { t } from 'svelte-i18n';

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
    await handleFiles(e.dataTransfer?.files);
  };

  const onPaste = ({ clipboardData }: ClipboardEvent) => handleFiles(clipboardData?.files);

  const handleFiles = async (files?: FileList) => {
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
