<script context="module" lang="ts">
	import type { Load } from '@sveltejs/kit';
	import { checkAppVersion } from '$lib/utils/check-app-version';

	export const load: Load = async ({ url, session }) => {
		if (session.user) {
			api.setAccessToken(session.user.accessToken);
		}

		return {
			props: { url },
		};
	};
</script>

<script lang="ts">
	import '../app.css';

	import { blur } from 'svelte/transition';

	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import AnnouncementBox from '$lib/components/shared/announcement-box.svelte';
	import UploadPanel from '$lib/components/shared/upload-panel.svelte';
	import { onMount } from 'svelte';
	import { api } from '@api';

	export let url: string;
	let shouldShowAnnouncement: boolean;
	let localVersion: string;
	let remoteVersion: string;

	onMount(async () => {
		const res = await checkAppVersion();

		shouldShowAnnouncement = res.shouldShowAnnouncement;
		localVersion = res.localVersion ?? 'unknown';
		remoteVersion = res.remoteVersion ?? 'unknown';
	});
</script>

<main>
	{#key url}
		<div transition:blur={{ duration: 250 }}>
			<slot />
			<DownloadPanel />
			<UploadPanel />
			{#if shouldShowAnnouncement}
				<AnnouncementBox {localVersion} {remoteVersion} on:close={() => (shouldShowAnnouncement = false)} />
			{/if}
		</div>
	{/key}
</main>
