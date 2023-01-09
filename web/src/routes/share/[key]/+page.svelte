<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import { AlbumResponseDto } from '../../../api';
	import type { PageData } from './$types';

	export let data: PageData;

	let album: AlbumResponseDto | null = null;
	if (data.sharedLink.album) {
		album = { ...data.sharedLink.album, assets: data.sharedLink.assets };
	}
</script>

<svelte:head>
	<title>{data.sharedLink.album?.albumName || 'Public Shared'} - Immich</title>
</svelte:head>

{#if album}
	<div class="immich-scrollbar">
		<AlbumViewer {album} sharedLink={data.sharedLink} />
	</div>
{/if}
