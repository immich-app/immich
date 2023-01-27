<script lang="ts">
	import { quartInOut } from 'svelte/easing';
	import { scale, fade } from 'svelte/transition';
	import { uploadAssetsStore } from '$lib/stores/upload';
	import CloudUploadOutline from 'svelte-material-icons/CloudUploadOutline.svelte';
	import WindowMinimize from 'svelte-material-icons/WindowMinimize.svelte';
	import type { UploadAsset } from '$lib/models/upload-asset';
	import { notificationController, NotificationType } from './notification/notification';
	import { asByteUnitString } from '$lib/utils/byte-units';

	let showDetail = true;

	let uploadLength = 0;

	const showUploadImageThumbnail = async (a: UploadAsset) => {
		const extension = a.fileExtension.toLowerCase();

		if (extension == 'jpeg' || extension == 'jpg' || extension == 'png') {
			try {
				const imgData = await a.file.arrayBuffer();
				const arrayBufferView = new Uint8Array(imgData);
				const blob = new Blob([arrayBufferView], { type: 'image/jpeg' });
				const urlCreator = window.URL || window.webkitURL;
				const imageUrl = urlCreator.createObjectURL(blob);
				// TODO: There is probably a cleaner way of doing this
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const img: any = document.getElementById(`${a.id}`);
				img.src = imageUrl;
			} catch {
				// Do nothing?
			}
		}
	};

	// Reactive action to get thumbnail image of upload asset whenever there is a new one added to the list
	$: {
		if ($uploadAssetsStore.length != uploadLength) {
			$uploadAssetsStore.map((asset) => {
				showUploadImageThumbnail(asset);
			});

			uploadLength = $uploadAssetsStore.length;
		}
	}

	$: {
		if (showDetail) {
			$uploadAssetsStore.map((asset) => {
				showUploadImageThumbnail(asset);
			});
		}
	}

	let isUploading = false;

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
							<div
								in:fade={{ duration: 250 }}
								out:fade={{ duration: 100 }}
								class="text-xs mt-3 rounded-lg bg-immich-bg grid grid-cols-[70px_auto] gap-2 h-[70px]"
							>
								<div class="relative">
									<img
										in:fade={{ duration: 250 }}
										id={`${uploadAsset.id}`}
										src="/immich-logo.svg"
										alt=""
										class="h-[70px] w-[70px] object-cover rounded-tl-lg rounded-bl-lg "
										draggable="false"
									/>

									<div class="bottom-0 left-0 absolute w-full h-[25px] bg-immich-primary/30">
										<p
											class="absolute bottom-1 right-1 object-right-bottom text-gray-50/95 font-semibold stroke-immich-primary uppercase"
										>
											.{uploadAsset.fileExtension}
										</p>
									</div>
								</div>

								<div class="p-2 pr-4 flex flex-col justify-between">
									<input
										disabled
										class="bg-gray-100 border w-full p-1 rounded-md text-[10px] px-2"
										value={`[${asByteUnitString(uploadAsset.file.size)}] ${uploadAsset.file.name}`}
									/>

									<div class="w-full bg-gray-300 h-[15px] rounded-md mt-[5px] text-white relative">
										<div
											class="bg-immich-primary h-[15px] rounded-md transition-all"
											style={`width: ${uploadAsset.progress}%`}
										/>
										<p class="absolute h-full w-full text-center top-0 text-[10px] ">
											{uploadAsset.progress}/100
										</p>
									</div>
								</div>
							</div>
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
