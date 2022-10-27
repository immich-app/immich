<script lang="ts">
	import '../app.css';

	import { fade } from 'svelte/transition';
	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import AnnouncementBox from '$lib/components/shared-components/announcement-box.svelte';
	import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
	import { onMount } from 'svelte';
	import { checkAppVersion } from '$lib/utils/check-app-version';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
	import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';

	let shouldShowAnnouncement: boolean;
	let localVersion: string;
	let remoteVersion: string;
	let showNavigationLoadingBar = false;
	let canShow = false;

	onMount(async () => {
		checkUserTheme();
		const res = await checkAppVersion();

		shouldShowAnnouncement = res.shouldShowAnnouncement;
		localVersion = res.localVersion ?? 'unknown';
		remoteVersion = res.remoteVersion ?? 'unknown';
	});

	const checkUserTheme = () => {
		// On page load or when changing themes, best to add inline in `head` to avoid FOUC
		if (
			localStorage.getItem('color-theme') === 'dark' ||
			(!('color-theme' in localStorage) &&
				window.matchMedia('(prefers-color-scheme: dark)').matches)
		) {
			document.documentElement.classList.add('dark');
		} else {
			document.documentElement.classList.remove('dark');
		}

		canShow = true;
	};

	beforeNavigate(() => {
		showNavigationLoadingBar = true;
	});

	afterNavigate(() => {
		showNavigationLoadingBar = false;
	});
</script>

<main>
	{#if canShow}
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
	{/if}
</main>
