<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>{data.sharedLink.album?.albumName || 'Public Shared'} - Immich</title>
</svelte:head>

{#if data.sharedLink.album}
	<div class="immich-scrollbar">
		<AlbumViewer album={data.sharedLink.album} sharedLink={data.sharedLink} />
	</div>
{/if}
