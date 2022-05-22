<script context="module" lang="ts">
	export const prerender = false;

	import type { Load } from '@sveltejs/kit';

	export const load: Load = ({ session }) => {
		if (!session.user) {
			return {
				status: 302,
				redirect: '/auth/login',
			};
		}

		return {
			status: 200,
			props: {
				user: session.user,
			},
		};
	};
</script>

<script lang="ts">
	import type { ImmichUser } from '$lib/models/immich-user';

	import NavigationBar from '../../lib/components/shared/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared/side-bar-button.svelte';
	import Magnify from 'svelte-material-icons/Magnify.svelte';
	import ImageOutline from 'svelte-material-icons/ImageOutline.svelte';
	import { AppSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { onDestroy, onMount } from 'svelte';
	import { session } from '$app/stores';
	import assetStore from '$lib/stores/assets';
	import type { ImmichAsset } from '../../lib/models/immich-asset';
	import ImmichThumbnail from '../../lib/components/photos/immich-thumbnail.svelte';
	import moment from 'moment';

	export let user: ImmichUser;
	let selectedAction: AppSideBarSelection;
	let assets: ImmichAsset[] = [];
	let assetsGroupByDate: ImmichAsset[][];

	// Subscribe to store values
	const assetsSub = assetStore.assets.subscribe((newAssets) => (assets = newAssets));
	const assetsGroupByDateSub = assetStore.assetsGroupByDate.subscribe((value) => (assetsGroupByDate = value));

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AppSideBarSelection;
	};

	onMount(async () => {
		selectedAction = AppSideBarSelection.PHOTOS;
		if ($session.user) {
			await assetStore.getAssetsInfo($session.user.accessToken);
		}
	});

	onDestroy(() => {
		assetsSub();
		assetsGroupByDateSub();
	});
</script>

<svelte:head>
	<title>Immich - Photos</title>
</svelte:head>

<section>
	<NavigationBar {user} />
</section>

<section class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen">
	<section id="admin-sidebar" class="flex flex-col gap-4 pt-8 pr-6">
		<SideBarButton
			title="Photos"
			logo={ImageOutline}
			actionType={AppSideBarSelection.PHOTOS}
			isSelected={selectedAction === AppSideBarSelection.PHOTOS}
			on:selected={onButtonClicked}
		/>

		<!-- <SideBarButton
			title="Explore"
			logo={Magnify}
			actionType={AppSideBarSelection.EXPLORE}
			isSelected={selectedAction === AppSideBarSelection.EXPLORE}
			on:selected={onButtonClicked}
		/> -->
	</section>

	<section class="overflow-y-auto relative">
		<section id="assets-content" class="relative pt-8">
			<section id="image-grid" class="flex flex-wrap gap-8">
				{#each assetsGroupByDate as assetsInDateGroup}
					<div class="flex flex-col">
						<p class="font-medium text-sm text-gray-500 mb-2">
							{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
						</p>
						<div class=" flex flex-wrap gap-2">
							{#each assetsInDateGroup as asset}
								<ImmichThumbnail {asset} />
							{/each}
						</div>
					</div>
				{/each}
			</section>
		</section>
	</section>
</section>
