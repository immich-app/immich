<script lang="ts">
	import { assets } from '$app/paths';

	import { AlbumResponseDto, api } from '@api';
	import { thumbnail } from 'exifr';
	import { createEventDispatcher, onMount } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';

	export let album: AlbumResponseDto;

	let imageData: string = '/no-thumbnail.png';

	const dispatch = createEventDispatcher();

	const getHighQualityImage = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, true, { responseType: 'blob' });
		if (data instanceof Blob) {
			console.log('get high quality image');
			imageData = URL.createObjectURL(data);
			return imageData;
		}
	};

	const loadImageData = async (thubmnailId: string | null) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, false, { responseType: 'blob' });
		if (data instanceof Blob) {
			imageData = URL.createObjectURL(data);
			getHighQualityImage(thubmnailId);
			return imageData;
		}
	};

	let viewWidth: number;
	let imageSize: number = 300;

	$: {
		if (album.assets.length < 6) {
			imageSize = viewWidth / album.assets.length - album.assets.length;
		} else {
			imageSize = viewWidth / 6 - 6;
		}
	}
</script>

<section class="absolute w-screen h-screen top-0 left-0 overflow-auto bg-immich-bg z-[9999]">
	<div class="flex justify-between p-2" title="Go Back">
		<button
			id="immich-circle-icon-button"
			class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
			on:click={() => dispatch('go-back')}
		>
			<ArrowLeft size="24" />
		</button>

		<div class="right-button-group" title="Add Photos">
			<button
				id="immich-circle-icon-button"
				class={`rounded-full p-3 flex place-items-center place-content-center text-gray-600 transition-all hover:bg-gray-200`}
				on:click={() => dispatch('click')}
			>
				<FileImagePlusOutline size="24" />
			</button>
		</div>
	</div>

	<section class="m-6 py-[72px] px-[160px]">
		<p class="text-6xl text-immich-primary">
			{album.albumName}
		</p>

		<p class="my-4">Date</p>

		<div class="flex flex-wrap gap-1 w-full border border-red-500" bind:clientWidth={viewWidth}>
			{#each album.assets as asset}
				{#await loadImageData(asset.id)}
					<div
						style:width={imageSize + 'px'}
						style:height={imageSize + 'px'}
						class={`bg-immich-primary/10 flex place-items-center place-content-center rounded-xl`}
					>
						...
					</div>
				{:then imageData}
					<img
						src={imageData}
						alt={album.id}
						style:width={imageSize + 'px'}
						style:height={imageSize + 'px'}
						class={`object-cover transition-all z-0 duration-300`}
					/>
				{/await}
			{/each}
		</div>
	</section>
</section>
