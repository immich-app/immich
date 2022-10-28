<script lang="ts">
	import { fade } from 'svelte/transition';

	import { onMount } from 'svelte';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import { api, AssetResponseDto } from '@api';
	import Keydown from 'svelte-keydown';

	export let assetId: string;
	export let deviceId: string;

	let assetInfo: AssetResponseDto;
	let assetData: string;

	let copyImageToClipboard : (src: string) => Promise<Blob>;

	onMount(async () => {
		const { data } = await api.assetApi.getAssetById(assetId);
		assetInfo = data;

		//Import hack :( see https://github.com/vadimkorr/svelte-carousel/issues/27#issuecomment-851022295
		const module = await import('copy-image-clipboard')
		copyImageToClipboard = module.copyImageToClipboard;
	});

	const loadAssetData = async () => {
		try {
			const { data } = await api.assetApi.serveFile(
				assetInfo.deviceAssetId,
				deviceId,
				false,
				true,
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

	const handleCopy = async (keyEvent: CustomEvent<string>) => {
		if (keyEvent.detail == 'Control-c' || keyEvent.detail == 'Meta-c') {
			await copyImageToClipboard(assetData);
		}
	};
</script>

<Keydown on:combo={handleCopy} />

<div
	transition:fade={{ duration: 150 }}
	class="flex place-items-center place-content-center h-full select-none"
>
	{#if assetInfo}
		{#await loadAssetData()}
			<LoadingSpinner />
		{:then assetData}
			<img
				transition:fade={{ duration: 150 }}
				src={assetData}
				alt={assetId}
				class="object-contain h-full transition-all"
				loading="lazy"
			/>
		{/await}
	{/if}
</div>
