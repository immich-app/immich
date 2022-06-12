<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { checkAppVersion } from '$lib/utils/check-app-version';
	import { browser } from '$app/env';

	export const load: Load = async ({ url }) => {
		if (browser) {
			const { shouldShowAnnouncement, localVersion, remoteVersion } = await checkAppVersion();

			console.log('Recheck');
			return { props: { url, shouldShowAnnouncement, localVersion, remoteVersion } };
		} else {
			return {
				props: { url },
			};
		}
	};
</script>

<script lang="ts">
	import '../app.css';

	import { blur } from 'svelte/transition';

	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import FullScreenModal from '../lib/components/shared/full-screen-modal.svelte';
	import AnnouncementBox from '../lib/components/shared/announcement-box.svelte';

	export let url: string;
	export let shouldShowAnnouncement: boolean;
	export let localVersion: string;
	export let remoteVersion: string;
</script>

<main>
	{#key url}
		<div transition:blur={{ duration: 250 }}>
			<slot />
			<DownloadPanel />

			{#if shouldShowAnnouncement}
				<AnnouncementBox {localVersion} {remoteVersion} on:close={() => (shouldShowAnnouncement = false)} />
			{/if}
		</div>
	{/key}
</main>
