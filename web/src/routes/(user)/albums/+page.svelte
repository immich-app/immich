<script lang="ts">
	import AlbumCard from '$lib/components/album-page/album-card.svelte';
	import { goto } from '$app/navigation';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import type { PageData } from './$types';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import { useAlbums } from './albums.bloc';
	import EmptyPlaceholder from '$lib/components/shared-components/empty-placeholder.svelte';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import LinkButton from '$lib/components/elements/buttons/link-button.svelte';
	import { onMount } from 'svelte';
	import { flip } from 'svelte/animate';

	export let data: PageData;

	const sortByOptions = ['Most recent photo', 'Last modified', 'Album title'];

	let selectedSortBy = sortByOptions[0];

	const handleChangeSortBy = (e: Event) => {
		const target = e.target as HTMLSelectElement;
		selectedSortBy = target.value;
	};

	const {
		albums: unsortedAlbums,
		isShowContextMenu,
		contextMenuPosition,
		createAlbum,
		deleteAlbum,
		deleteSelectedContextAlbum,
		showAlbumContextMenu,
		closeAlbumContextMenu
	} = useAlbums({ albums: data.albums });

	let albums = unsortedAlbums;

	const sortByDate = (a: string, b: string) => {
		const aDate = new Date(a);
		const bDate = new Date(b);
		return bDate.getTime() - aDate.getTime();
	};

	$: {
		if (selectedSortBy === 'Most recent photo') {
			$albums = $unsortedAlbums.sort((a, b) =>
				a.lastModifiedAssetTimestamp && b.lastModifiedAssetTimestamp
					? sortByDate(a.lastModifiedAssetTimestamp, b.lastModifiedAssetTimestamp)
					: sortByDate(a.updatedAt, b.updatedAt)
			);
		} else if (selectedSortBy === 'Last modified') {
			$albums = $unsortedAlbums.sort((a, b) => sortByDate(a.updatedAt, b.updatedAt));
		} else if (selectedSortBy === 'Album title') {
			$albums = $unsortedAlbums.sort((a, b) => a.albumName.localeCompare(b.albumName));
		}
	}

	const handleCreateAlbum = async () => {
		const newAlbum = await createAlbum();
		if (newAlbum) {
			goto('/albums/' + newAlbum.id);
		}
	};

	onMount(() => {
		removeAlbumsIfEmpty();
	});

	const removeAlbumsIfEmpty = async () => {
		try {
			for (const album of $albums) {
				if (album.assetCount == 0 && album.albumName == 'Untitled') {
					await deleteAlbum(album);
					$albums = $albums.filter((a) => a.id !== album.id);
				}
			}
		} catch (error) {
			console.log(error);
		}
	};
</script>

<UserPageLayout user={data.user} title={data.meta.title}>
	<div class="flex place-items-center gap-2" slot="buttons">
		<label class="text-xs" for="sortBy">Sort by:</label>
		<select
			class="text-sm bg-slate-200 p-2 rounded-lg dark:bg-gray-600 hover:cursor-pointer"
			name="sortBy"
			id="sortBy-select"
			bind:value={selectedSortBy}
			on:change={handleChangeSortBy}
		>
			{#each sortByOptions as option}
				<option value={option}>{option}</option>
			{/each}
		</select>

		<LinkButton on:click={handleCreateAlbum}>
			<div class="flex place-items-center gap-2 text-sm">
				<PlusBoxOutline size="18" />
				Create album
			</div>
		</LinkButton>
	</div>

	<!-- Album Card -->
	<div class="grid grid-cols-[repeat(auto-fill,minmax(15rem,1fr))]">
		{#each $albums as album (album.id)}
			<a
				data-sveltekit-preload-data="hover"
				href={`albums/${album.id}`}
				animate:flip={{ duration: 200 }}
			>
				<AlbumCard
					{album}
					on:showalbumcontextmenu={(e) => showAlbumContextMenu(e.detail, album)}
					user={data.user}
				/>
			</a>
		{/each}
	</div>

	<!-- Empty Message -->
	{#if $albums.length === 0}
		<EmptyPlaceholder
			text="Create an album to organize your photos and videos"
			actionHandler={handleCreateAlbum}
			alt="Empty albums"
		/>
	{/if}
</UserPageLayout>

<!-- Context Menu -->
{#if $isShowContextMenu}
	<ContextMenu {...$contextMenuPosition} on:outclick={closeAlbumContextMenu}>
		<MenuOption on:click={deleteSelectedContextAlbum}>
			<span class="flex place-items-center place-content-center gap-2">
				<DeleteOutline size="18" />
				<p>Delete album</p>
			</span>
		</MenuOption>
	</ContextMenu>
{/if}
