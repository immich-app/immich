<script lang="ts">
	import type { ImmichAsset } from '../../models/immich-asset';
	import { session } from '$app/stores';
	import { onDestroy } from 'svelte';
	import { fade } from 'svelte/transition';
	import { serverEndpoint } from '../../constants';
	import IntersectionObserver from '$lib/components/photos/intersection-observer.svelte';

	export let asset: ImmichAsset;
	let imageContent: string;

	const loadImageData = async () => {
		if ($session.user) {
			const res = await fetch(serverEndpoint + '/asset/thumbnail/' + asset.id, {
				method: 'GET',
				headers: {
					Authorization: 'bearer ' + $session.user.accessToken,
				},
			});

			imageContent = URL.createObjectURL(await res.blob());

			return imageContent;
		}
	};

	onDestroy(() => URL.revokeObjectURL(imageContent));
</script>

<IntersectionObserver once={true} let:intersecting>
	<div class="h-[200px] w-[200px] bg-gray-100">
		{#if intersecting}
			{#await loadImageData()}
				<div class="bg-immich-primary/10 h-[200px] w-[200px] flex place-items-center place-content-center">...</div>
			{:then imageData}
				<img
					in:fade={{ duration: 200 }}
					src={imageData}
					alt={asset.id}
					class="object-cover h-[200px] w-[200px] transition-all duration-100"
					loading="lazy"
				/>
			{/await}
		{/if}
	</div>
</IntersectionObserver>
