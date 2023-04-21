<script lang="ts">
	import { UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Logout from 'svelte-material-icons/Logout.svelte';
	import { goto } from '$app/navigation';
	import Button from '$lib/components/elements/buttons/button.svelte';

	export let user: UserResponseDto;

	// Show fallback while loading profile picture and hide when image loads.
	let showProfilePictureFallback = true;

	const dispatch = createEventDispatcher();

	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};
</script>

<div
	in:fade={{ duration: 100 }}
	out:fade={{ duration: 100 }}
	id="account-info-panel"
	class="absolute right-[25px] top-[75px] bg-gray-200 dark:bg-immich-dark-gray dark:border dark:border-immich-dark-gray shadow-lg rounded-3xl w-[360px] text-center z-[100]"
>
	<div class="bg-white dark:bg-immich-dark-primary/10 rounded-3xl mx-4 mt-4 pb-4">
		<div class="flex place-items-center place-content-center">
			<div
				class="flex place-items-center place-content-center rounded-full bg-immich-primary dark:bg-immich-dark-primary dark:immich-dark-primary/80 h-20 w-20 text-gray-100 hover:bg-immich-primary dark:text-immich-dark-bg mt-4 select-none"
			>
				{#if user.profileImagePath}
					<img
						transition:fade={{ duration: 100 }}
						class:hidden={showProfilePictureFallback}
						src={`${$page.url.origin}/api/user/profile-image/${user.id}`}
						alt="profile-img"
						class="inline rounded-full h-20 w-20 object-cover shadow-md border-2 border-immich-primary dark:border-immich-dark-primary"
						draggable="false"
						on:load={() => (showProfilePictureFallback = false)}
					/>
				{/if}
				{#if showProfilePictureFallback}
					<div transition:fade={{ duration: 200 }} class="text-lg">
						{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
					</div>
				{/if}
			</div>
		</div>

		<p class="text-lg text-immich-primary dark:text-immich-dark-primary font-medium mt-4">
			{user.firstName}
			{user.lastName}
		</p>

		<p class="text-sm text-gray-500 dark:text-immich-dark-fg">{user.email}</p>

		<div class="mt-4">
			<Button
				color="dark-gray"
				size="sm"
				shadow={false}
				border
				on:click={() => {
					goto('/user-settings');
					dispatch('close');
				}}
			>
				<div class="flex gap-2 place-items-center place-content-center px-2">
					<Cog size="18" />
					Account Settings
				</div>
			</Button>
		</div>
	</div>

	<div class="mb-4 flex flex-col">
		<button
			class="py-3 w-full font-medium flex place-items-center gap-2 hover:bg-immich-primary/10 text-gray-500 dark:text-gray-300 place-content-center"
			on:click={() => dispatch('logout')}
		>
			<Logout size={24} />
			Sign Out</button
		>
	</div>
</div>
