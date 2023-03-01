<script lang="ts">
	import '../app.css';

	import { page } from '$app/stores';
	import { afterNavigate, beforeNavigate } from '$app/navigation';
	import NavigationLoadingBar from '$lib/components/shared-components/navigation-loading-bar.svelte';
	import DownloadPanel from '$lib/components/asset-viewer/download-panel.svelte';
	import UploadPanel from '$lib/components/shared-components/upload-panel.svelte';
	import NotificationList from '$lib/components/shared-components/notification/notification-list.svelte';
	import VersionAnnouncementBox from '$lib/components/shared-components/version-announcement-box.svelte';
	import faviconUrl from '$lib/assets/favicon.png';
	import type { LayoutData } from './$types';

	let showNavigationLoadingBar = false;

	beforeNavigate(() => {
		showNavigationLoadingBar = true;
	});

	afterNavigate(() => {
		showNavigationLoadingBar = false;
	});

	export let data: LayoutData;
</script>

<svelte:head>
	<title>{$page.data.meta?.title || 'Web'} - Immich</title>
	<link rel="icon" href={faviconUrl} />

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

{#if showNavigationLoadingBar}
	<NavigationLoadingBar />
{/if}

<slot />

<DownloadPanel />
<UploadPanel />
<NotificationList />

{#if data.user?.isAdmin}
	<VersionAnnouncementBox serverVersion={data.serverVersion} />
{/if}
