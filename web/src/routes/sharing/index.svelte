<script context="module" lang="ts">
	export const prerender = false;

	import { ImmichUser } from '$lib/models/immich-user';
	import type { Load } from '@sveltejs/kit';
	import { AlbumResponseDto, api } from '@api';

	export const load: Load = async ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}

		let sharedAlbums: AlbumResponseDto[] = [];
		try {
			const { data } = await api.albumApi.getAllAlbums(true);
			sharedAlbums = data;
		} catch (e) {
			console.log('Error [getAllAlbums] ', e);
		}

		return {
			status: 200,
			props: {
				user: session.user,
				sharedAlbums: sharedAlbums
			}
		};
	};
</script>

<script lang="ts">
	import NavigationBar from '$lib/components/shared/navigation-bar.svelte';
	import SideBar from '$lib/components/shared/side-bar/side-bar.svelte';
	import PlusBoxOutline from 'svelte-material-icons/PlusBoxOutline.svelte';
	import AlbumCard from '$lib/components/album/album-card.svelte';

	export let user: ImmichUser;
	export let sharedAlbums: AlbumResponseDto[];
</script>

<svelte:head>
	<title>Albums - Immich</title>
</svelte:head>

<section>
	<NavigationBar {user} on:uploadClicked={() => {}} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />

	<section class="overflow-y-auto relative">
		<section id="album-content" class="relative pt-8 pl-4 mb-12 bg-immich-bg">
			<!-- Main Section -->
			<div class="px-4 flex justify-between place-items-center">
				<div>
					<p>Sharing</p>
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

			<!-- Share Album List -->
			<div class="flex flex-wrap gap-8">
				{#each sharedAlbums as album}
					<a sveltekit:prefetch href={`albums/${album.id}`}> <AlbumCard {album} /></a>
				{/each}
			</div>
		</section>
	</section>
</section>
