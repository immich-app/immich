<script lang="ts">
	import { quartInOut } from 'svelte/easing';
	import { scale, fade } from 'svelte/transition';
	import { uploadAssetsStore } from '$lib/stores/upload';
	import CloudUploadOutline from 'svelte-material-icons/CloudUploadOutline.svelte';
	import WindowMinimize from 'svelte-material-icons/WindowMinimize.svelte';
	import { notificationController, NotificationType } from './notification/notification';
	import UploadAssetPreview from './upload-asset-preview.svelte';

	let showDetail = true;
	let uploadLength = 0;
	let isUploading = false;

	// Reactive action to update asset uploadLength whenever there is a new one added to the list
	$: {
		if ($uploadAssetsStore.length != uploadLength) {
			uploadLength = $uploadAssetsStore.length;
		}
	}

	uploadAssetsStore.isUploading.subscribe((value) => {
		isUploading = value;
	});
</script>

{#if isUploading}
	<div
		in:fade={{ duration: 250 }}
		out:fade={{ duration: 250, delay: 1000 }}
		on:outroend={() => {
			notificationController.show({
				message: 'Upload success, refresh the page to see new upload assets',
				type: NotificationType.Info
			});
		}}
		class="absolute right-6 bottom-6 z-[10000]"
	>
		{#if showDetail}
			<div
				in:scale={{ duration: 250, easing: quartInOut }}
				class="bg-gray-200 p-4 text-sm w-[300px] rounded-lg shadow-sm border "
			>
				<div class="flex justify-between place-item-center mb-4">
					<p class="text-xs text-gray-500">UPLOADING {$uploadAssetsStore.length}</p>
					<button
						on:click={() => (showDetail = false)}
						class="w-[20px] h-[20px] bg-gray-50 rounded-full flex place-items-center place-content-center transition-colors hover:bg-gray-100"
					>
						<WindowMinimize />
					</button>
				</div>

				<div class="max-h-[400px] overflow-y-auto pr-2 rounded-lg immich-scrollbar">
					{#each $uploadAssetsStore as uploadAsset}
						{#key uploadAsset.id}
							<UploadAssetPreview {uploadAsset} />
						{/key}
					{/each}
				</div>
			</div>
		{:else}
			<div class="rounded-full">
				<button
					in:scale={{ duration: 250, easing: quartInOut }}
					on:click={() => (showDetail = true)}
					class="absolute -top-4 -left-4 text-xs rounded-full w-10 h-10 p-5 flex place-items-center place-content-center bg-immich-primary text-gray-200"
				>
					{$uploadAssetsStore.length}
				</button>
				<button
					in:scale={{ duration: 250, easing: quartInOut }}
					on:click={() => (showDetail = true)}
					class="bg-gray-300 p-5 rounded-full w-16 h-16 flex place-items-center place-content-center text-sm shadow-lg "
				>
					<div class="animate-pulse">
						<CloudUploadOutline size="30" color="#4250af" />
					</div>
				</button>
			</div>
		{/if}
	</div>
{/if}
