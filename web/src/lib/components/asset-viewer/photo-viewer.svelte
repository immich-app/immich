<script lang="ts">
	import { fade } from 'svelte/transition';
	import { onMount } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto } from '@api';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let asset: AssetResponseDto;
	export let publicSharedKey = '';

	let assetData: string;

	let copyImageToClipboard: (src: string) => Promise<Blob>;
	let canCopyImagesToClipboard: () => boolean;

	onMount(async () => {
		// Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
		// TODO: Move to regular import once the package correctly supports ESM.
		const module = await import('copy-image-clipboard');
		copyImageToClipboard = module.copyImageToClipboard;
		canCopyImagesToClipboard = module.canCopyImagesToClipboard;
	});

	const loadAssetData = async () => {
		try {
			const { data } = await api.assetApi.serveFile(
				{ assetId: asset.id, isThumb: false, isWeb: true, key: publicSharedKey },
				{
					responseType: 'blob'
				}
			);

			if (!(data instanceof Blob)) {
				return;
			}

			assetData = URL.createObjectURL(data);
			return assetData;
		} catch {
			// Do nothing
		}
	};

	const handleKeypress = async ({ metaKey, ctrlKey, key }: KeyboardEvent) => {
		if ((metaKey || ctrlKey) && key === 'c') {
			await doCopy();
		}
	};

	const doCopy = async () => {
		if (!canCopyImagesToClipboard()) {
			return;
		}

		try {
			await copyImageToClipboard(assetData);
			notificationController.show({
				type: NotificationType.Info,
				message: 'Copied image to clipboard.',
				timeout: 3000
			});
		} catch (err) {
			console.error('Error [photo-viewer]:', err);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Copying image to clipboard failed.'
			});
		}
	};
</script>

<svelte:window on:keydown={handleKeypress} on:copyImage={doCopy} />

<div
	transition:fade={{ duration: 150 }}
	class="flex place-items-center place-content-center h-full select-none"
>
	{#await loadAssetData()}
		<LoadingSpinner />
	{:then assetData}
		<img
			transition:fade={{ duration: 150 }}
			src={assetData}
			alt={asset.id}
			class="object-contain h-full transition-all"
			draggable="false"
		/>
	{/await}
</div>
