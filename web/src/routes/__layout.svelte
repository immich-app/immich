<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';

	export const load: Load = async ({ url }) => ({ props: { url } });
</script>

<script lang="ts">
	import '../app.css';

	import { blur } from 'svelte/transition';

	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';

	export let url: string;
</script>

<main>
	{#key url}
		<div transition:blur={{ duration: 250 }}>
			<slot />
			<DownloadPanel />
		</div>
	{/key}
</main>
