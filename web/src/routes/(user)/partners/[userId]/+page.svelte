<script lang="ts">
	import type { PageData } from './$types';
	import { AppRoute } from '$lib/constants';
	import { goto } from '$app/navigation';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import AssetGrid from '$lib/components/photos-page/asset-grid.svelte';

	export let data: PageData;
</script>

<main class="grid h-screen pt-[4.25rem] bg-immich-bg dark:bg-immich-dark-bg">
	<ControlAppBar
		showBackButton
		backIcon={ArrowLeft}
		on:close-button-click={() => goto(AppRoute.SHARING)}
	>
		<p slot="leading" class="text-immich-fg dark:text-immich-dark-fg">
			{data.partner.firstName}
			{data.partner.lastName}'s photos
		</p>
	</ControlAppBar>

	<AssetGrid user={data.partner} />
</main>
