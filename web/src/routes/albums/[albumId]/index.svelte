<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';
	import { AlbumResponseDto, api } from '@api';

	export const load: Load = async ({ params }) => {
		try {
			const albumId = params['albumId'];

			const { data: albumInfo } = await api.albumApi.getAlbumInfo(albumId);

			return {
				status: 200,
				props: {
					album: albumInfo
				}
			};
		} catch (e) {
			if (e instanceof AxiosError) {
				if (e.response?.status === 404) {
					return {
						status: 302,
						redirect: '/albums'
					};
				}
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
	import { AxiosError } from 'axios';

	export let album: AlbumResponseDto;
</script>

<svelte:head>
	<title>{album.albumName} - Immich</title>
</svelte:head>

<div class="immich-scrollbar">
	<AlbumViewer {album} />
</div>
