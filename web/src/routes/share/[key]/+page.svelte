<script lang="ts">
	import AlbumViewer from '$lib/components/album-page/album-viewer.svelte';
	import { AlbumResponseDto, ThumbnailFormat } from '@api';
	import { getThumbnailUrl } from '../../../lib/utils/asset-utils';
	import type { PageData } from './$types';

	export let data: PageData;

	const { sharedLink } = data;

	const assetCount = sharedLink.assets.length;

	let album: AlbumResponseDto | null = null;
	if (sharedLink.album) {
		album = { ...sharedLink.album, assets: sharedLink.assets };
	}

	export const ssr = true;
 
	const url = `/share/${sharedLink.key}`;
	const title = (album ? album.albumName : 'Public Share') + ' - Immich';
	const description = `${assetCount} shared photos & videos.`;
	const assetId = album?.albumThumbnailAssetId || sharedLink.assets[0]?.id;
	const imageUrl = assetId
		? getThumbnailUrl(assetId, ThumbnailFormat.Webp, sharedLink.key)
		: 'feature-panel.png';
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Facebook Meta Tags -->
	<meta property="og:url" content={url} />
	<meta property="og:type" content="website" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:image" content={imageUrl} />

	<!-- Twitter Meta Tags -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta property="twitter:domain" content="demo.immich.app" />
	<meta property="twitter:url" content={url} />
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
	<meta name="twitter:image" content={imageUrl} />
</svelte:head>

{#if album}
	<div class="immich-scrollbar">
		<AlbumViewer {album} {sharedLink} />
	</div>
{/if}
