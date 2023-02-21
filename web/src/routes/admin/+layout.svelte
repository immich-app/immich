<script lang="ts">
	import { page } from '$app/stores';
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import Sync from 'svelte-material-icons/Sync.svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import { goto } from '$app/navigation';
	import { AppRoute } from '../../lib/constants';

	const getPageTitle = (routeId: string | null) => {
		switch (routeId) {
			case AppRoute.ADMIN_USER_MANAGEMENT:
				return 'User Management';
			case AppRoute.ADMIN_SETTINGS:
				return 'System Settings';
			case AppRoute.ADMIN_JOBS:
				return 'Jobs';
			case AppRoute.ADMIN_STATS:
				return 'Server Stats';
			default:
				return '';
		}
	};
</script>

<NavigationBar user={$page.data.user} />

<main>
	<section class="grid grid-cols-[250px_auto] pt-[72px] h-screen">
		<section id="admin-sidebar" class="pt-8 pr-6 flex flex-col gap-1">
			<SideBarButton
				title="Users"
				logo={AccountMultipleOutline}
				isSelected={$page.route.id === AppRoute.ADMIN_USER_MANAGEMENT}
				on:selected={() => goto(AppRoute.ADMIN_USER_MANAGEMENT)}
			/>
			<SideBarButton
				title="Jobs"
				logo={Sync}
				isSelected={$page.route.id === AppRoute.ADMIN_JOBS}
				on:selected={() => goto(AppRoute.ADMIN_JOBS)}
			/>
			<SideBarButton
				title="Settings"
				logo={Cog}
				isSelected={$page.route.id === AppRoute.ADMIN_SETTINGS}
				on:selected={() => goto(AppRoute.ADMIN_SETTINGS)}
			/>
			<SideBarButton
				title="Server Stats"
				logo={Server}
				isSelected={$page.route.id === AppRoute.ADMIN_STATS}
				on:selected={() => goto(AppRoute.ADMIN_STATS)}
			/>
			<div class="mb-6 mt-auto">
				<StatusBox />
			</div>
		</section>

		<section class="overflow-y-auto immich-scrollbar ">
			<div id="setting-title" class="pt-10 w-full bg-immich-bg dark:bg-immich-dark-bg">
				<h1 class="text-lg ml-8 mb-4 text-immich-primary dark:text-immich-dark-primary font-medium">
					{getPageTitle($page.route.id)}
				</h1>
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<section id="setting-content" class="flex place-content-center">
				<section class="w-[800px] pt-5 pb-28">
					<slot />
				</section>
			</section>
		</section>
	</section>
</main>
