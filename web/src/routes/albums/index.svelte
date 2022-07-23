<script context="module" lang="ts">
	export const prerender = false;

	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';

	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import { ImmichUser } from '$lib/models/immich-user';
	import type { Load } from '@sveltejs/kit';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import { AlbumResponseDto, api } from '@api';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		let albums: AlbumResponseDto[] = [];
		try {
			const { data } = await api.albumApi.getAllAlbums();
			albums = data;
		} catch (e) {
			console.log('Error [getAllAlbums] ', e);
		}

		return {
			status: 200,
			props: {
				user: session.user,
				albums: albums
			}
		};
	};
</script>

<script lang="ts">
	import AlbumCard from '$lib/components/album-page/album-card.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	export let user: ImmichUser;
	export let albums: AlbumResponseDto[];

	onMount(async () => {
		const { data } = await api.albumApi.getAllAlbums();
		albums = data;

		// Delete album that has no photos and is named 'Untitled'
		for (const album of albums) {
			if (album.albumName === 'Untitled' && album.assets.length === 0) {
				const isDeleted = await deleteAlbum(album);

				if (isDeleted) {
					albums = albums.filter((a) => a.id !== album.id);
				}
			}
		}
	});

	const createAlbum = async () => {
		try {
			const { data: newAlbum } = await api.albumApi.createAlbum({
				albumName: 'Untitled'
			});

			goto('/albums/' + newAlbum.id);
		} catch (e) {
			console.log('Error [createAlbum] ', e);
		}
	};

	const deleteAlbum = async (album: AlbumResponseDto) => {
		try {
			await api.albumApi.deleteAlbum(album.id);
			return true;
		} catch (e) {
			console.log('Error [deleteAlbum] ', e);
			return false;
		}
	};
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={() => {}} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg ">
	<SideBar />

	<!-- Main Section -->

	<section class="overflow-y-auto relative immich-scrollbar">
		<section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<div class="px-4 flex justify-between place-items-center">
				<div>
					<p class="font-medium">Albums</p>
				</div>

				<div>
					<button on:click={createAlbum} class="immich-text-button text-sm">
						<span>
							<PlusBoxOutline size="18" />
						</span>
						<p>Create album</p>
					</button>
				</div>
			</div>

			<div class="my-4">
				<hr />
			</div>

			<!-- Album Card -->
			<div class="flex flex-wrap gap-8">
				{#each albums as album}
					<a sveltekit:prefetch href={`albums/${album.id}`}>
						<AlbumCard {album} />
					</a>
				{/each}
			</div>
		</section>
	</section>
</section>
