<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';

	import type { PageData } from './$types';

	import { openFileUploadDialog, UploadType } from '$lib/utils/file-uploader';
	import { onMount } from 'svelte';
	import { closeWebsocketConnection, openWebsocketConnection } from '$lib/stores/websocket';

	export let data: PageData;

	onMount(async () => {
		openWebsocketConnection();

		return () => {
			closeWebsocketConnection();
		};
	});
</script>

<svelte:head>
	<title>Photos - Immich</title>
</svelte:head>

<section>
	<NavigationBar
		user={data.user}
		on:uploadClicked={() => openFileUploadDialog(UploadType.GENERAL)}
	/>
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg">
	<SideBar />
	<AssetGrid />
</section>
