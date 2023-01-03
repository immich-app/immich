<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import { ThumbnailFormat } from '@api';
	import type { PageData } from './$types';

	export let data: PageData;

	const viewAssetHandler = (e: CustomEvent) => {
		console.log('viewAssetHandler', e.detail);
	};
</script>

<svelte:head>
	<title>{data.sharedLink.album?.albumName || 'Public Shared'} - Immich</title>
</svelte:head>

{#if data.sharedLink.album}
	<div class="immich-scrollbar">
		<AlbumViewer album={data.sharedLink.album} publicSharedKey={data.sharedLink.key} />
	</div>
{/if}
