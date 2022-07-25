<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { AlbumResponseDto, api } from '@api';

	let album: AlbumResponseDto;

	onMount(async () => {
		const albumId = $page.params['albumId'];
		const { data } = await api.albumApi.getAlbumInfo(albumId);
		album = data;
	});
</script>

<svelte:head>
	<title>{album?.albumName} - Immich</title>
</svelte:head>

<div class="relative immich-scrollbar">
	{#if album}
		<AlbumViewer {album} />
	{/if}
</div>
