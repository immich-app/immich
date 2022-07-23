<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import { AlbumResponseDto, api } from '@api';

	export const load: Load = async ({ session, params }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login'
			};
		}
		const albumId = params['albumId'];

		let album: AlbumResponseDto;

		try {
			const { data } = await api.albumApi.getAlbumInfo(albumId);
			album = data;
		} catch (e) {
			return {
				status: 302,
				redirect: '/albums'
			};
		}

		return {
			status: 200,
			props: {
				album: album
			}
		};
	};
</script>

<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';

	export let album: AlbumResponseDto;
</script>

<svelte:head>
	<title>{album.albumName} - Immich</title>
</svelte:head>

<div class="relative immich-scrollbar">
	<AlbumViewer {album} />
</div>
