<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import UserPageLayout from '$lib/components/layouts/user-page-layout.svelte';
	import SideBarButton from '$lib/components/shared-components/side-bar/side-bar-button.svelte';
	import SideBarSection from '$lib/components/shared-components/side-bar/side-bar-section.svelte';
	import StatusBox from '$lib/components/shared-components/status-box.svelte';
	import { AppRoute } from '$lib/constants';
	import { UserResponseDto } from '@api';
	import AccountMultipleOutline from 'svelte-material-icons/AccountMultipleOutline.svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Server from 'svelte-material-icons/Server.svelte';
	import Sync from 'svelte-material-icons/Sync.svelte';

	export let user: UserResponseDto;
	export let title: string | undefined = undefined;
</script>

<UserPageLayout {user} showUploadButton={false} {title}>
	<SideBarSection slot="sidebar">
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
	</SideBarSection>

	<section id="setting-content" class="flex place-content-center mx-4">
		<section class="w-full sm:w-5/6 md:w-[800px] pt-5 pb-28">
			<slot />
		</section>
	</section>
</UserPageLayout>
