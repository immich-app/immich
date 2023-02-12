<script lang="ts">
	import { fade } from 'svelte/transition';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto } from '@api';
	import { copyImageToClipboard } from 'copy-image-clipboard';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let asset: AssetResponseDto;
	export let publicSharedKey = '';

	let assetData: string;

	const loadAssetData = async () => {
		try {
			const { data } = await api.assetApi.serveFile(asset.id, false, true, {
				params: {
					key: publicSharedKey
				},
				responseType: 'blob'
			});

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

	export const doCopy = async () => {
		try {
			await copyImageToClipboard(assetData);
			notificationController.show({
				type: NotificationType.Info,
				message: 'Copied image to clipboard.',
				timeout: 3000
			});
		} catch (err) {
			console.error(err);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Copying image to clipboard failed. Click here to learn more.',
				timeout: 5000,
				action: {
					type: 'link',
					target:
						'https://github.com/LuanEdCosta/copy-image-clipboard#enable-clipboard-api-features-in-firefox'
				}
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
