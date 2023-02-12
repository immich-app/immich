<script lang="ts">
	import '../app.css';

	import { fade } from 'svelte/transition';
	import { page } from '$app/stores';
	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import AnnouncementBox from '$lib/components/shared-components/announcement-box.svelte';
	import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
	import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
	import { onMount } from 'svelte';
	import { checkAppVersion } from '$lib/utils/check-app-version';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
	import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
	import { fileUploadHandler } from '$lib/utils/file-uploader';

	let shouldShowAnnouncement: boolean;
	let localVersion: string;
	let remoteVersion: string;
	let showNavigationLoadingBar = false;
	let canShow = false;
	let showUploadCover = false;

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

	const dropHandler = async (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();

		showUploadCover = false;

		const files = event.dataTransfer?.files;
		if (!files) {
			return;
		}

		const filesArray: File[] = Array.from<File>(files);
		const albumId = ($page.route.id === '/albums/[albumId]' || undefined) && $page.params.albumId;

		await fileUploadHandler(filesArray, albumId);
	};

	// Required to prevent default browser behavior
	const dragOverHandler = (event: DragEvent) => {
		event.preventDefault();
		event.stopPropagation();
	};
</script>

<svelte:head>
	<title>{$page.data.meta?.title || 'Web'} - Immich</title>
	{#if $page.data.meta}
		<meta name="description" content={$page.data.meta.description} />

		<!-- Facebook Meta Tags -->
		<meta property="og:type" content="website" />
		<meta property="og:title" content={$page.data.meta.title} />
		<meta property="og:description" content={$page.data.meta.description} />
		<meta property="og:image" content={$page.data.meta.imageUrl} />

		<!-- Twitter Meta Tags -->
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:title" content={$page.data.meta.title} />
		<meta name="twitter:description" content={$page.data.meta.description} />
		<meta name="twitter:image" content={$page.data.meta.imageUrl} />
	{/if}
</svelte:head>

<main on:dragenter={() => (showUploadCover = true)}>
	{#if canShow}
		<div in:fade={{ duration: 100 }}>
			{#if showNavigationLoadingBar}
				<NavigationLoadingBar />
			{/if}

			<slot />

			{#if showUploadCover}
				<UploadCover
					{dropHandler}
					{dragOverHandler}
					dragLeaveHandler={() => (showUploadCover = false)}
				/>
			{/if}

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
