<script lang="ts">
	import { AlbumResponseDto, api } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import BaseModal from './base-modal.svelte';
	import AlbumListItem from '../asset-viewer/album-list-item.svelte';

	let albums: AlbumResponseDto[] = [];
	let recentAlbums: AlbumResponseDto[] = [];
	let loading = true;

	const dispatch = createEventDispatcher();

	export let shared: boolean;

	onMount(async () => {
		const { data } = await api.albumApi.getAllAlbums();
		albums = data;
		recentAlbums = albums
			.filter((album) => album.shared === shared)
			.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1))
			.slice(0, 3);
		loading = false;
	});

	const handleSelect = (album: AlbumResponseDto) => {
		dispatch('album', { album });
	};

	const handleNew = () => {
		if (shared) {
			dispatch('newAlbum');
		} else {
			dispatch('newSharedAlbum');
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<p class="font-medium">
				Add to {#if shared}shared {/if}
			</p>
		</span>
	</svelte:fragment>

	<div class=" max-h-[400px] overflow-y-auto immich-scrollba pb-10">
		<div class="flex flex-col mb-2">
			{#if loading}
				{#each { length: 3 } as _}
					<div class="animate-pulse flex gap-4 px-6 py-2">
						<div class="h-12 w-12 bg-slate-200 rounded-xl" />
						<div class="flex flex-col items-start justify-center gap-2">
							<span class="animate-pulse w-36 h-4 bg-slate-200" />
							<div class="flex animate-pulse gap-1">
								<span class="w-8 h-3 bg-slate-200" />
								<span class="w-20 h-3 bg-slate-200" />
							</div>
						</div>
					</div>
				{/each}
			{:else}
				<button
					on:click={handleNew}
					class="flex gap-4 px-6 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors items-center"
				>
					<div class="h-12 w-12 flex justify-center items-center">
						<Plus size="30" />
					</div>
					<p class="">
						New {#if shared}Shared {/if}Album
					</p>
				</button>
				{#if albums.length > 0}
					{#if !shared}
						<p class="text-xs px-5 py-3">RECENT</p>
					{/if}
					{#each recentAlbums as album}
						{#key album.id}
							<AlbumListItem variant="simple" {album} on:album={() => handleSelect(album)} />
						{/key}
					{/each}

					{#if !shared}
						<p class="text-xs px-5 py-3">ALL ALBUMS</p>
					{/if}
					{#each albums as album}
						{#key album.id}
							<AlbumListItem {album} on:album={() => handleSelect(album)} />
						{/key}
					{/each}
				{:else}
					<p class="text-sm px-5 py-1">It looks like you do not have any albums yet.</p>
				{/if}
			{/if}
		</div>
	</div>
</BaseModal>
