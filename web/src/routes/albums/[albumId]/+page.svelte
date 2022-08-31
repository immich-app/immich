<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.album.albumName} - Immich</title>
</svelte:head>

<div class="immich-scrollbar">
	<AlbumViewer album={data.album} />
</div>
