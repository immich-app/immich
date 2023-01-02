<script lang="ts">
	import ImmichThumbnail from '$lib/components/shared-components/immich-thumbnail.svelte';
	import { ThumbnailFormat } from '@api';
	import type { PageData } from './$types';

	export let data: PageData;

	const viewAssetHandler = (e: CustomEvent) => {
		console.log('viewAssetHandler', e.detail);
	};
</script>

<section class="dark:text-immich-gray">
	<pre class="text-xs">
    {JSON.stringify(data, null, 2)}
  </pre>
	{data.sharedLink.album?.albumName}

	<div>
		{#each data.assets as asset}
			<ImmichThumbnail
				{asset}
				thumbnailSize={300}
				format={ThumbnailFormat.Jpeg}
				on:click={(e) => viewAssetHandler(e)}
			/>
		{/each}
	</div>
</section>
