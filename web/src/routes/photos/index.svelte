<script context="module" lang="ts">
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
	import { onMount } from 'svelte';

	export let user: ImmichUser;
	let selectedAction: AppSideBarSelection;

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AppSideBarSelection;
	};

	onMount(() => {
		selectedAction = AppSideBarSelection.PHOTOS;
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

		<SideBarButton
			title="Explore"
			logo={Magnify}
			actionType={AppSideBarSelection.EXPLORE}
			isSelected={selectedAction === AppSideBarSelection.EXPLORE}
			on:selected={onButtonClicked}
		/>
	</section>

	<section class="overflow-y-auto relative">
		<section id="setting-content" class="relative pt-[85px]">
			<section class="pt-4">Coming soon</section>
		</section>
	</section>
</section>
