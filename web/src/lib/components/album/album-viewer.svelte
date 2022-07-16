<script lang="ts">
	import { assets } from '$app/paths';
	import IntersectionObserver from '$lib/components/asset-viewer/intersection-observer.svelte';

	import { AlbumResponseDto, api, ThumbnailFormat } from '@api';
	import _ from 'lodash';
	import { createEventDispatcher } from 'svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import FileImagePlusOutline from 'svelte-material-icons/FileImagePlusOutline.svelte';
	import { fade } from 'svelte/transition';
	import ImmichThumbnail from '../asset-viewer/immich-thumbnail.svelte';

	const dispatch = createEventDispatcher();
	export let album: AlbumResponseDto;
	let viewWidth: number;
	let thumbnailSize: number = 300;

	$: {
		if (album.assets.length < 6) {
			thumbnailSize = Math.floor(viewWidth / album.assets.length - album.assets.length);
		} else {
			thumbnailSize = Math.floor(viewWidth / 6 - 6);
		}
	}

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

		{#if album.sharedUsers.length > 0}
			{#each album.sharedUsers as user}
				<p class="my-4 text-sm text-gray-500">{user.email}</p>
			{/each}
		{/if}

		<div class="flex flex-wrap gap-1 w-full" bind:clientWidth={viewWidth}>
			{#each album.assets as asset}
				{#if album.assets.length < 7}
					<ImmichThumbnail {asset} {thumbnailSize} format={ThumbnailFormat.Jpeg} />
				{:else}
					<ImmichThumbnail {asset} {thumbnailSize} />
				{/if}
			{/each}
		</div>
	</section>
</section>
