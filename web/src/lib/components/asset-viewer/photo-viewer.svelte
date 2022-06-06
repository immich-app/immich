<script lang="ts">
	import { session } from '$app/stores';
	import { serverEndpoint } from '$lib/constants';
	import { fade } from 'svelte/transition';

	import type { ImmichAsset, ImmichExif } from '$lib/models/immich-asset';
	import { createEventDispatcher, onMount } from 'svelte';
	import LoadingSpinner from '../shared/loading-spinner.svelte';

	export let assetId: string;
	export let deviceId: string;

	let assetInfo: ImmichAsset;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/assetById/' + assetId, {
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});
			assetInfo = await res.json();
		}
	});

	const loadAssetData = async () => {
		const assetUrl = `/asset/file?aid=${assetInfo.deviceAssetId}&did=${deviceId}&isWeb=true`;
		if ($session.user) {
			const res = await fetch(serverEndpoint + assetUrl, {
				method: 'GET',
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});

			const assetData = URL.createObjectURL(await res.blob());

			return assetData;
		}
	};
</script>

<div transition:fade={{ duration: 150 }} class="flex place-items-center place-content-center h-full select-none">
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
