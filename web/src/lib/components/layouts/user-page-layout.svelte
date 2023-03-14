<script lang="ts">
	import { openFileUploadDialog } from '$lib/utils/file-uploader';
	import type { UserResponseDto } from '@api';
	import NavigationBar from '../shared-components/navigation-bar/navigation-bar.svelte';
	import SideBar from '../shared-components/side-bar/side-bar.svelte';

	export let user: UserResponseDto;
	export let hideNavbar = false;
	export let showUploadButton = false;
	export let title: string | undefined = undefined;
</script>

<header>
	{#if !hideNavbar}
		<NavigationBar
			{user}
			shouldShowUploadButton={showUploadButton}
			on:uploadClicked={() => openFileUploadDialog()}
		/>
	{/if}

	<slot name="header" />
</header>

<main
	class="grid grid-cols-[250px_auto] relative pt-[4.25rem] h-screen bg-immich-bg dark:bg-immich-dark-bg immich-scrollbar"
>
	<SideBar />

	<slot name="content">
		<section class="my-8 mx-4 bg-immich-bg dark:bg-immich-dark-bg">
			{#if title}
				<div class="flex justify-between place-items-center dark:text-immich-dark-fg px-4 h-10">
					<p class="font-medium">{title}</p>

					<slot name="buttons" />
				</div>

				<div class="my-4">
					<hr class="dark:border-immich-dark-gray" />
				</div>
			{/if}

			<slot />
		</section>
	</slot>
</main>
