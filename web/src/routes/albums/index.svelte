<script context="module" lang="ts">
	export const prerender = false;

	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';

	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import { ImmichUser } from '$lib/models/immich-user';
	import type { Load } from '@sveltejs/kit';
	import SideBar from '$lib/components/shared/side-bar/side-bar.svelte';
	import { AlbumResponseDto, api } from '@api';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		let allAlbums: AlbumResponseDto[] = [];
		try {
			const { data } = await api.albumApi.getAllAlbums();
			allAlbums = data;
		} catch (e) {
			console.log('Error [getAllAlbums] ', e);
		}

		return {
			status: 200,
			props: {
				user: session.user,
				allAlbums: allAlbums
			}
		};
	};
</script>

<script lang="ts">
	import AlbumCard from '$lib/components/album/album-card.svelte';
	import { goto } from '$app/navigation';

	export let user: ImmichUser;
	export let allAlbums: AlbumResponseDto[];

	const showAlbum = (event: CustomEvent) => {
		goto('/albums/' + event.detail.id);
	};
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={() => {}} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />

	<!-- Main Section -->

	<section class="overflow-y-auto relative">
		<section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<div class="px-4 flex justify-between place-items-center">
				<div>
					<p>Albums</p>
				</div>

				<div>
					<button
						class="flex place-items-center gap-1 text-sm hover:bg-immich-primary/5 p-2 rounded-lg font-medium hover:text-gray-700"
					>
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
				{#each allAlbums as album}
					<a sveltekit:prefetch href={`albums/${album.id}`}> <AlbumCard {album} /></a>
				{/each}
			</div>
		</section>
	</section>
</section>
