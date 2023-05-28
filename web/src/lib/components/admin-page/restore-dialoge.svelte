<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';
	import Button from '../elements/buttons/button.svelte';

	export let user: UserResponseDto;

	const dispatch = createEventDispatcher();

	const restoreUser = async () => {
		const restoredUser = await api.userApi.restoreUser({ userId: user.id });
		if (restoredUser.data.deletedAt == null) dispatch('user-restore-success');
		else dispatch('user-restore-fail');
	};
</script>

<div
	class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
>
	<div
		class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
	>
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
			Restore User
		</h1>
	</div>
	<div>
		<p class="ml-4 text-md py-5 text-center">
			{user.firstName}
			{user.lastName} account will restored
		</p>

		<div class="flex w-full px-4 gap-4 mt-8">
			<Button color="green" fullwidth on:click={restoreUser}>Confirm</Button>
		</div>
	</div>
</div>
