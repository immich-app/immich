<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import ContextMenu from '$lib/components/shared-components/context-menu/context-menu.svelte';
	import MenuOption from '$lib/components/shared-components/context-menu/menu-option.svelte';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import type { PageData } from './$types';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import DeleteEmpty from 'svelte-material-icons/DeleteEmpty.svelte';
	import { api } from '@api';
	import LoadingSpinner from '$lib/components/shared-components/loading-spinner.svelte';

	export let data: PageData;

	//TODO only get the recycle config
	const getReycleBinConfig = async () => {
		const { data } = await api.systemConfigApi.getConfig();
		return data.recycleBin;
	};
</script>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg  dark:bg-immich-dark-bg"
>
	<SideBar />

	<section class="overflow-y-auto relative immich-scrollbar">
		<section
			id="recycling-bin-content"
			class="relative pt-8 pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<div class="px-4 flex justify-between place-items-center dark:text-immich-dark-fg">
				<div>
					<p class="font-medium">Bin</p>
				</div>

				<div>
					<button
						class="immich-text-button text-sm dark:hover:bg-immich-dark-primary/25 dark:text-immich-dark-fg"
					>
						<span>
							<DeleteEmpty size="18" />
						</span>
						<p>Empty Bin</p>
					</button>
				</div>
			</div>

			<div class="my-4">
				<hr class="dark:border-immich-dark-gray" />
			</div>
		</section>
		{#await getReycleBinConfig()}
			<LoadingSpinner />
		{:then configs}
			<section class="relative pl-4 mb-12 bg-immich-bg dark:bg-immich-dark-bg">
				<div>
					{#if configs.enabled}
						<p class="font-medium">
							Items in the bin will be permanently deleted after {configs.days} days.
						</p>
					{:else}
						<p class="font-medium">Recycling Bin has not been setup. Contact admin</p>
					{/if}
				</div>
			</section>
		{/await}
	</section>
</section>
