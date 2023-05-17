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

	const {
		albums,
		isShowContextMenu,
		contextMenuPosition,
		createAlbum,
		deleteAlbum,
		deleteSelectedContextAlbum,
		showAlbumContextMenu,
		closeAlbumContextMenu
	} = useAlbums({ albums: data.albums });

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
	<div slot="buttons">
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
	<ContextMenu {...$contextMenuPosition} on:clickoutside={closeAlbumContextMenu}>
		<MenuOption on:click={deleteSelectedContextAlbum}>
			<span class="flex place-items-center place-content-center gap-2">
				<DeleteOutline size="18" />
				<p>Delete album</p>
			</span>
		</MenuOption>
	</ContextMenu>
{/if}
