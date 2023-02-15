<script lang="ts">
	import { fade } from 'svelte/transition';

	import { onMount } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto } from '@api';
	import Keydown from 'svelte-keydown';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let asset: AssetResponseDto;
	export let publicSharedKey = '';

	let assetData: string;

	let copyImageToClipboard: (src: string) => Promise<Blob>;

	onMount(async () => {
		//Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
		const module = await import('copy-image-clipboard');
		copyImageToClipboard = module.copyImageToClipboard;
	});

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

	const handleKeypress = async (keyEvent: CustomEvent<string>) => {
		if (keyEvent.detail == 'Control-c' || keyEvent.detail == 'Meta-c') {
			await doCopy();
		}
	};

	export const doCopy = async () => {
		await copyImageToClipboard(assetData);
		notificationController.show({
			type: NotificationType.Info,
			message: 'Copied image to clipboard.',
			timeout: 3000
		});
	};
</script>

<Keydown on:combo={handleKeypress} />

<svelte:window on:copyImage={async () => await doCopy()} />

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
