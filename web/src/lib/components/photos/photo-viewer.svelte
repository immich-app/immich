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
	export let exifInfo: ImmichExif;

	const dispatch = createEventDispatcher();

	onMount(async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/assetById/' + assetId, {
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});
			assetInfo = await res.json();

			if (assetInfo.exifInfo) exifInfo = assetInfo.exifInfo;
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

<div class="flex place-items-center place-content-center h-full select-none">
	{#if assetInfo}
		{#await loadAssetData()}
			<LoadingSpinner />
		{:then assetData}
			<img src={assetData} alt={assetId} class="object-contain  h-full" loading="lazy" />
		{/await}
	{/if}
</div>
