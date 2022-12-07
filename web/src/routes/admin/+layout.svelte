<script lang="ts">
	import { page } from '$app/stores';
	import NavigationBar from '$lib/components/shared-components/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import Sync from 'svelte-material-icons/Sync.svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import { AdminSideBarSelection } from '$lib/models/admin-sidebar-selection';
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";

	let selectedAction: AdminSideBarSelection = AdminSideBarSelection.USER_MANAGEMENT;

	const onButtonClicked = (buttonType: CustomEvent) => {
		selectedAction = buttonType.detail['actionType'] as AdminSideBarSelection;

		switch(selectedAction) {
			case AdminSideBarSelection.USER_MANAGEMENT:
				goto('/admin/user-management');
				break;
			case AdminSideBarSelection.SETTINGS:
				goto('/admin/settings');
				break;
			case AdminSideBarSelection.JOBS:
				goto('/admin/jobs-status');
				break;
			case AdminSideBarSelection.STATS:
				goto('/admin/server-status');
				break;
		}
	};

	onMount(() => {
		const path = $page.route.id;

		switch(path) {
			case '/admin/user-management':
				selectedAction = AdminSideBarSelection.USER_MANAGEMENT;
				break;
			case '/admin/settings':
				selectedAction = AdminSideBarSelection.SETTINGS;
				break;
			case '/admin/jobs-status':
				selectedAction = AdminSideBarSelection.JOBS;
				break;
			case '/admin/server-status':
				selectedAction = AdminSideBarSelection.STATS;
				break;
		}
	});


</script>

<svelte:head>
	<title>Administration - Immich</title>
</svelte:head>

<NavigationBar user={$page.data.user} />

<main>
	<section class="grid grid-cols-[250px_auto] pt-[72px] h-screen">
		<section id="admin-sidebar" class="pt-8 pr-6 flex flex-col gap-1">
			<SideBarButton
							title="Users"
							logo={AccountMultipleOutline}
							actionType={AdminSideBarSelection.USER_MANAGEMENT}
							isSelected={selectedAction === AdminSideBarSelection.USER_MANAGEMENT}
							on:selected={onButtonClicked}
			/>
			<SideBarButton
							title="Jobs"
							logo={Sync}
							actionType={AdminSideBarSelection.JOBS}
							isSelected={selectedAction === AdminSideBarSelection.JOBS}
							on:selected={onButtonClicked}
			/>
			<SideBarButton
							title="Settings"
							logo={Cog}
							actionType={AdminSideBarSelection.SETTINGS}
							isSelected={selectedAction === AdminSideBarSelection.SETTINGS}
							on:selected={onButtonClicked}
			/>
			<SideBarButton
							title="Server Stats"
							logo={Server}
							actionType={AdminSideBarSelection.STATS}
							isSelected={selectedAction === AdminSideBarSelection.STATS}
							on:selected={onButtonClicked}
			/>
			<div class="mb-6 mt-auto">
				<StatusBox />
			</div>
		</section>

		<section class="overflow-y-auto">
			<div id="setting-title" class="pt-10 fixed w-full z-50">
				<h1 class="text-lg ml-8 mb-4 text-immich-primary dark:text-immich-dark-primary font-medium">
					{selectedAction}
				</h1>
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<section id="setting-content" class="pt-[85px] flex place-content-center">
				<section class="w-[800px] pt-5">
					<slot />
				</section>
			</section>
		</section>
	</section>


</main>

