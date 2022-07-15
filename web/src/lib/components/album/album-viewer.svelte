<script lang="ts">
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';

	import { AlbumResponseDto, api, ThumbnailFormat } from '@api';
	import _ from 'lodash';
	import { createEventDispatcher } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import { fade } from 'svelte/transition';

	const dispatch = createEventDispatcher();
	export let album: AlbumResponseDto;
	let viewWidth: number;
	let imageSize: number = 300;

	$: {
		if (album.assets.length < 6) {
			imageSize = Math.floor(viewWidth / album.assets.length - album.assets.length);
		} else {
			imageSize = Math.floor(viewWidth / 6 - 6);
		}
	}

	const getThumbnail = async (thubmnailId: string | null, format: ThumbnailFormat) => {
		if (thubmnailId == null) {
			return '/no-thumbnail.png';
		}

		const { data } = await api.assetApi.getAssetThumbnail(thubmnailId!, format, { responseType: 'blob' });
		if (data instanceof Blob) {
			return URL.createObjectURL(data);
		}
	};

	const getDateRange = () => {
		const startDate = new Date(album.assets[0].createdAt);
		const endDate = new Date(album.assets[album.assets.length - 1].createdAt);

		const startDateString = startDate.toLocaleDateString('us-EN', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
		const endDateString = endDate.toLocaleDateString('us-EN', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
		});
		return `${startDateString} - ${endDateString}`;
	};
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

		<p class="my-4 text-sm text-gray-500">{getDateRange()}</p>

		<div class="flex flex-wrap gap-1 w-full" bind:clientWidth={viewWidth}>
			{#each album.assets as asset}
				<IntersectionObserver once={true} let:intersecting>
					<div style:width={imageSize + 'px'} style:height={imageSize + 'px'}>
						{#if intersecting}
							{#if album.assets.length < 7}
								{#await getThumbnail(asset.id, ThumbnailFormat.Jpeg)}
									<div
										style:width={imageSize + 'px'}
										style:height={imageSize + 'px'}
										class={`bg-immich-primary/10 flex place-items-center place-content-center rounded-xl`}
									>
										...
									</div>
								{:then jpegData}
									<img
										src={jpegData}
										alt={album.id}
										style:width={imageSize + 'px'}
										style:height={imageSize + 'px'}
										class={`object-cover transition-all z-0 duration-300`}
										in:fade={{ duration: 250 }}
										loading="lazy"
									/>
								{/await}
							{:else}
								{#await getThumbnail(asset.id, ThumbnailFormat.Webp)}
									<div
										style:width={imageSize + 'px'}
										style:height={imageSize + 'px'}
										class={`bg-immich-primary/10 flex place-items-center place-content-center rounded-xl`}
									>
										...
									</div>
								{:then webpData}
									<img
										src={webpData}
										alt={album.id}
										style:width={imageSize + 'px'}
										style:height={imageSize + 'px'}
										class={`object-cover transition-all z-0 duration-300`}
										in:fade={{ duration: 250 }}
										loading="lazy"
									/>
								{/await}
							{/if}
						{/if}
					</div>
				</IntersectionObserver>
			{/each}
		</div>
	</section>
</section>
