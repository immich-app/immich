<script lang="ts">
	import Button from '$lib/components/elements/buttons/button.svelte';
	import { AppRoute } from '$lib/constants';
	import type { UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import Cog from 'svelte-material-icons/Cog.svelte';
	import Logout from 'svelte-material-icons/Logout.svelte';
	import { fade } from 'svelte/transition';
	import UserAvatar from '../user-avatar.svelte';

	export let user: UserResponseDto;

	const dispatch = createEventDispatcher();
</script>

<div
	in:fade={{ duration: 100 }}
	out:fade={{ duration: 100 }}
	id="account-info-panel"
	class="absolute right-[25px] top-[75px] bg-gray-200 dark:bg-immich-dark-gray dark:border dark:border-immich-dark-gray shadow-lg rounded-3xl w-[360px] z-[100]"
>
	<div
		class="flex flex-col items-center justify-center gap-4 bg-white dark:bg-immich-dark-primary/10 rounded-3xl mx-4 mt-4 p-4"
	>
		<UserAvatar size="lg" {user} />

		<div>
			<p class="text-lg text-immich-primary dark:text-immich-dark-primary font-medium text-center">
				{user.firstName}
				{user.lastName}
			</p>
			<p class="text-sm text-gray-500 dark:text-immich-dark-fg">{user.email}</p>
		</div>

		<a href={AppRoute.USER_SETTINGS} on:click={() => dispatch('close')}>
			<Button color="dark-gray" size="sm" shadow={false} border>
				<div class="flex gap-2 place-items-center place-content-center px-2">
					<Cog size="18" />
					Account Settings
				</div>
			</Button>
		</a>
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
