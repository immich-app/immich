<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import { AlbumResponseDto } from '@api';
	import type { PageData } from './$types';

	export let data: PageData;

	const { sharedLink } = data;

	let album: AlbumResponseDto | null = null;
	if (sharedLink.album) {
		album = { ...sharedLink.album, assets: sharedLink.assets };
	}
</script>

{#if album}
	<div class="immich-scrollbar">
		<AlbumViewer {album} {sharedLink} />
	</div>
{/if}
