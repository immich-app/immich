<script lang="ts">
	import '../app.css';

	import { fade } from 'svelte/transition';
	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import AnnouncementBox from '$lib/components/shared-components/announcement-box.svelte';
	import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
	import { onMount } from 'svelte';
	import { checkAppVersion } from '$lib/utils/check-app-version';
	import { page } from '$app/stores';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
	import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';

	let shouldShowAnnouncement: boolean;
	let localVersion: string;
	let remoteVersion: string;
	let showNavigationLoadingBar = false;

	onMount(async () => {
		const res = await checkAppVersion();

		shouldShowAnnouncement = res.shouldShowAnnouncement;
		localVersion = res.localVersion ?? 'unknown';
		remoteVersion = res.remoteVersion ?? 'unknown';
	});

	beforeNavigate(() => {
		showNavigationLoadingBar = true;
	});

	afterNavigate(() => {
		showNavigationLoadingBar = false;
	});
</script>

<main>
	<!-- {#key $page.url} -->
	<div in:fade={{ duration: 100 }}>
		{#if showNavigationLoadingBar}
			<NavigationLoadingBar />
		{/if}

		<slot />

		<DownloadPanel />
		<UploadPanel />
		<NotificationList />
		{#if shouldShowAnnouncement}
			<AnnouncementBox
				{localVersion}
				{remoteVersion}
				on:close={() => (shouldShowAnnouncement = false)}
			/>
		{/if}
	</div>
	<!-- {/key} -->
</main>
