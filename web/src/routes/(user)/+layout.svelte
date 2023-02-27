<script lang="ts">
	import { page } from '$app/stores';
	import { fileUploadHandler } from '$lib/utils/file-uploader';
	import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';

	const dropHandler = async ({ dataTransfer }: DragEvent) => {
		const files = dataTransfer?.files;
		if (!files) {
			return;
		}

		const filesArray: File[] = Array.from<File>(files);
		const albumId = ($page.route.id === '/albums/[albumId]' || undefined) && $page.params.albumId;

		await fileUploadHandler(filesArray, albumId);
	};
</script>

<slot />

<UploadCover {dropHandler} />
