<script lang="ts">
	import NavigationBar from '$lib/components/shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '$lib/components/shared-components/side-bar/side-bar.svelte';
	import UserSettingsList from '$lib/components/user-settings-page/user-settings-list.svelte';
	import type { PageData } from './$types';

	export let data: PageData;
</script>

<svelte:head>
	<title>Settings - Immich</title>
</svelte:head>

<section>
	<NavigationBar user={data.user} shouldShowUploadButton={false} />
</section>

<section
	class="grid grid-cols-[250px_auto] relative pt-[72px] h-screen bg-immich-bg dark:bg-immich-dark-bg"
>
	<SideBar />

	<section class="overflow-y-auto ">
		<div
			id="user-setting-title"
			class="pt-10 fixed w-full z-50 bg-immich-bg dark:bg-immich-dark-bg"
		>
			<h1 class="text-lg ml-8 mb-4 text-immich-primary dark:text-immich-dark-primary font-medium">
				User Settings
			</h1>
			<hr class="dark:border-immich-dark-gray" />
		</div>

		<section id="user-setting-content" class="pt-[85px] flex place-content-center">
			<section class="w-[800px] pt-5">
				<UserSettingsList user={data.user} />
			</section>
		</section>
	</section>
</section>
