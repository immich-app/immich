<script lang="ts">
	// DO NOT include `import { page } from '$app/stores'` here, because this can
	// lead to pages not being unmounted, which then causes weird page nesting
	// and routing issues.
	//
	// This is an issue in SvelteKit caused by using the page store in layouts and
	// using transitions on pages: https://github.com/sveltejs/kit/issues/7405

	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import Sync from 'svelte-material-icons/Sync.svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import { goto } from '$app/navigation';
	import { AppRoute } from '../../lib/constants';
	import type { LayoutData } from './$types';
	import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';

	export let data: LayoutData;

	// Circumvents the need to import the page store. Should be replaced by
	// `$page.data.meta.title` once issue #7405 of SvelteKit is resolved.
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

<NavigationBar user={data.user} />

<main>
	<section
		class="grid md:grid-cols-[theme(spacing.64)_auto] grid-cols-[theme(spacing.18)_auto] pt-[var(--navbar-height)] h-screen"
	>
		<SideBarSection>
			<SideBarButton
				title="Users"
				logo={AccountMultipleOutline}
				isSelected={data.routeId === AppRoute.ADMIN_USER_MANAGEMENT}
				on:selected={() => goto(AppRoute.ADMIN_USER_MANAGEMENT)}
			/>
			<SideBarButton
				title="Jobs"
				logo={Sync}
				isSelected={data.routeId === AppRoute.ADMIN_JOBS}
				on:selected={() => goto(AppRoute.ADMIN_JOBS)}
			/>
			<SideBarButton
				title="Settings"
				logo={Cog}
				isSelected={data.routeId === AppRoute.ADMIN_SETTINGS}
				on:selected={() => goto(AppRoute.ADMIN_SETTINGS)}
			/>
			<SideBarButton
				title="Server Stats"
				logo={Server}
				isSelected={data.routeId === AppRoute.ADMIN_STATS}
				on:selected={() => goto(AppRoute.ADMIN_STATS)}
			/>
			<div class="mb-6 mt-auto">
				<StatusBox />
			</div>
		</SideBarSection>

		<section class="overflow-y-auto immich-scrollbar">
			<div id="setting-title" class="pt-10 w-full bg-immich-bg dark:bg-immich-dark-bg">
				<h1 class="text-lg ml-8 mb-4 text-immich-primary dark:text-immich-dark-primary font-medium">
					{getPageTitle(data.routeId)}
				</h1>
				<hr class="dark:border-immich-dark-gray" />
			</div>

			<section id="setting-content" class="flex place-content-center mx-4">
				<section class="w-full sm:w-5/6 md:w-[800px] pt-5 pb-28">
					<slot />
				</section>
			</section>
		</section>
	</section>
</main>
