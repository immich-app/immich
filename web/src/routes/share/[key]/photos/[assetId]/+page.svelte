<script lang="ts">
	import AssetViewer from '$lib/components/asset-viewer/asset-viewer.svelte';
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	export let data: PageData;
</script>

{#if data.asset && data.key}
	<AssetViewer
		asset={data.asset}
		publicSharedKey={data.key}
		on:navigate-previous={() => null}
		on:navigate-next={() => null}
		showNavigation={false}
		on:close={() => goto(`/share/${data.key}`)}
	/>
{/if}
