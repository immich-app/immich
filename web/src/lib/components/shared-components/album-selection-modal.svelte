<script lang="ts">
	import { AlbumResponseDto, api } from '@api';
	import { createEventDispatcher, onMount } from 'svelte';
	import Plus from 'svelte-material-icons/Plus.svelte';
	import BaseModal from './base-modal.svelte';
	import AlbumListItem from '../asset-viewer/album-list-item.svelte';

	let albums: AlbumResponseDto[] = [];
	let recentAlbums: AlbumResponseDto[] = [];
	let filteredAlbums: AlbumResponseDto[] = [];
	let loading = true;
	let search = '';

	const dispatch = createEventDispatcher();

	export let shared: boolean;

	onMount(async () => {
		const { data } = await api.albumApi.getAllAlbums({ shared: shared || undefined });
		albums = data;

		recentAlbums = albums
			.sort((a, b) => (new Date(a.createdAt) > new Date(b.createdAt) ? -1 : 1))
			.slice(0, 3);

		loading = false;
	});

	$: {
		if (search.length > 0 && albums.length > 0) {
			filteredAlbums = albums.filter((album) => {
				return album.albumName.toLowerCase().includes(search.toLowerCase());
			});
		} else {
			filteredAlbums = albums;
		}
	}

	const handleSelect = (album: AlbumResponseDto) => {
		dispatch('album', { album });
	};

	const handleNew = () => {
		if (shared) {
			dispatch('newAlbum', { albumName: search.length > 0 ? search : 'Untitled' });
		} else {
			dispatch('newSharedAlbum', { albumName: search.length > 0 ? search : 'Untitled' });
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<p class="font-medium">
				Add to {#if shared}Shared {/if} Album
			</p>
		</span>
	</svelte:fragment>

	<div class="max-h-[400px] flex flex-col mb-2">
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
			<!-- svelte-ignore a11y-autofocus -->
			<input
				class="px-6 py-2 text-2xl border-b-4 bg-immich-bg border-immich-bg focus:border-immich-primary dark:bg-immich-dark-gray dark:border-immich-dark-gray dark:focus:border-immich-dark-primary"
				placeholder="Search"
				autofocus
				bind:value={search}
			/>
			<div class="overflow-y-auto immich-scrollbar">
				<button
					on:click={handleNew}
					class="w-full flex gap-4 px-6 py-2 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors items-center"
				>
					<div class="h-12 w-12 flex justify-center items-center">
						<Plus size="30" />
					</div>
					<p class="">
						New {#if shared}Shared {/if}Album {#if search.length > 0}<b>{search}</b>{/if}
					</p>
				</button>
				{#if filteredAlbums.length > 0}
					{#if !shared && search.length === 0}
						<p class="text-xs px-5 py-3">RECENT</p>
						{#each recentAlbums as album (album.id)}
							<AlbumListItem variant="simple" {album} on:album={() => handleSelect(album)} />
						{/each}
					{/if}

					{#if !shared}
						<p class="text-xs px-5 py-3">
							{#if search.length === 0}ALL {/if}ALBUMS
						</p>
					{/if}
					{#each filteredAlbums as album (album.id)}
						<AlbumListItem {album} searchQuery={search} on:album={() => handleSelect(album)} />
					{/each}
				{:else if albums.length > 0}
					<p class="text-sm px-5 py-1">
						It looks like you do not have any albums with this name yet.
					</p>
				{:else}
					<p class="text-sm px-5 py-1">It looks like you do not have any albums yet.</p>
				{/if}
			</div>
		{/if}
	</div>
</BaseModal>
