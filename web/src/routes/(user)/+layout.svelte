<script lang="ts">
  import { page } from '$app/stores';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import { dragAndDropFilesStore } from '$lib/stores/drag-and-drop-files.store';
  import { fileUploadHandler } from '$lib/utils/file-uploader';

  let albumId: string | undefined;

  const dropHandler = async ({ dataTransfer }: DragEvent) => {
    const files = dataTransfer?.files;
    if (!files) {
      return;
    }

    const filesArray: File[] = Array.from<File>(files);
    albumId = ($page.route.id === '/(user)/albums/[albumId]' || undefined) && $page.params.albumId;

    const isShare = $page.route.id === '/(user)/share/[key]' || undefined;
    if (isShare) {
      dragAndDropFilesStore.set({ isDragging: true, files: filesArray });
    } else {
      await fileUploadHandler(filesArray, albumId);
    }
  };
</script>

<slot {albumId} />

<UploadCover {dropHandler} />
