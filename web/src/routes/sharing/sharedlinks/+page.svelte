<script lang="ts">
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import { api } from '@api';
	import { goto } from '$app/navigation';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';
	import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
	import ThemeButton from '$lib/components/shared-components/theme-button.svelte';

	const getSharedLinks = async () => {
		const { data: sharedLinks } = await api.shareApi.getAllSharedLinks();

		return sharedLinks;
	};
</script>

<svelte:head>
	<title>Shared links - Immich</title>
</svelte:head>

<ControlAppBar backIcon={ArrowLeft} on:close-button-click={() => goto('/sharing')}>
	<svelte:fragment slot="leading">Shared links</svelte:fragment>
</ControlAppBar>

<section class="flex flex-col  pb-[120px] mt-[120px]">
	<div class="w-[50%] m-auto mb-4 dark:text-immich-gray">
		<p>Manage shared links</p>
	</div>
	{#await getSharedLinks()}
		<LoadingSpinner />
	{:then sharedLinks}
		<div class="flex flex-col w-[50%] m-auto">
			{#each sharedLinks as link (link.id)}
				<SharedLinkCard {link} />
			{/each}
		</div>
	{/await}
</section>
