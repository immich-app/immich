<script lang="ts">
	import { clickOutside } from '$lib/utils/click-outside';
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import { page } from '$app/stores';
	import { fade } from 'svelte/transition';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Logout from 'svelte-material-icons/Logout.svelte';
	import { goto } from '$app/navigation';

	export let user: UserResponseDto;

	const dispatch = createEventDispatcher();

	const getFirstLetter = (text?: string) => {
		return text?.charAt(0).toUpperCase();
	};

	const getUserProfileImage = async () => {
		if (!user.profileImagePath) {
			return null;
		}
		return api.userApi.getProfileImage(user.id).catch(() => null);
	};
</script>

<div
	in:fade={{ duration: 100 }}
	out:fade={{ duration: 100 }}
	id="account-info-panel"
	class="absolute right-[25px] top-[75px] bg-gray-200 dark:bg-immich-dark-gray dark:border dark:border-immich-dark-gray shadow-lg rounded-3xl w-[360px] text-center z-[100]"
	use:clickOutside
	on:outclick={() => dispatch('close')}
>
	<div class="bg-white dark:bg-immich-dark-primary/10 rounded-3xl mx-4 mt-4 pb-4">
		<div class="flex place-items-center place-content-center">
			<button
				class="flex place-items-center place-content-center rounded-full bg-immich-primary dark:bg-immich-dark-primary dark:immich-dark-primary/80 h-20 w-20 text-gray-100 hover:bg-immich-primary dark:text-immich-dark-bg mt-4"
			>
				{#await getUserProfileImage() then}
					<img
						transition:fade={{ duration: 100 }}
						src={`${$page.url.origin}/api/user/profile-image/${user.id}`}
						alt="profile-img"
						class="inline rounded-full h-20 w-20 object-cover shadow-md border-2 border-immich-primary dark:border-immich-dark-primary"
						draggable="false"
					/>
				{:catch}
					<div transition:fade={{ duration: 200 }} class="text-lg">
						{getFirstLetter(user.firstName)}{getFirstLetter(user.lastName)}
					</div>
				{/await}
			</button>
		</div>

		<p class="text-lg text-immich-primary dark:text-immich-dark-primary font-medium mt-4">
			{user.firstName}
			{user.lastName}
		</p>

		<p class="text-sm text-gray-500 dark:text-immich-dark-fg">{user.email}</p>

		<div class=" mt-4 flex place-items-center place-content-center">
			<button
				class="flex border rounded-3xl px-6 py-2 hover:bg-immich-primary/10 dark:border-immich-dark-gray dark:bg-gray-500 dark:hover:bg-immich-dark-primary/50 dark:text-white font-medium place-items-center place-content-center gap-2"
				on:click={() => {
					goto('/user-settings');
					dispatch('close');
				}}
			>
				<span><Cog size="18" /></span>Account Settings</button
			>
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
