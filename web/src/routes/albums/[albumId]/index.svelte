<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import { AlbumResponseDto } from '@api';

	export const load: Load = async ({ fetch, params }) => {
		try {
			const albumId = params['albumId'];

			const albumInfo = await fetch(`/data/album/get-album-info?albumId=${albumId}`).then((r) =>
				r.json()
			);

			return {
				status: 200,
				props: {
					album: albumInfo
				}
			};
		} catch (e: any) {
			if (e.response?.status === 404) {
				return {
					status: 302,
					redirect: '/albums'
				};
			}

			return {
				status: 302,
				redirect: '/auth/login'
			};
		}
	};
</script>

<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';

	export let album: AlbumResponseDto;
</script>

<svelte:head>
	<title>{album.albumName} - Immich</title>
</svelte:head>

<div class="immich-scrollbar">
	<AlbumViewer {album} />
</div>
