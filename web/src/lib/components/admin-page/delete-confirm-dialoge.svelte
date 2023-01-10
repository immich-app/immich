<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import { createEventDispatcher } from 'svelte';

	export let user: UserResponseDto;

	const dispatch = createEventDispatcher();

	const deleteUser = async () => {
		const deletedUser = await api.userApi.deleteUser(user.id);
		if (deletedUser.data.deletedAt != null) dispatch('user-delete-success');
		else dispatch('user-delete-fail');
	};
</script>

<div
	class="border bg-immich-bg dark:bg-immich-dark-gray dark:border-immich-dark-gray p-4 shadow-sm w-[500px] max-w-[95vw] rounded-3xl py-8 dark:text-immich-dark-fg"
>
	<div
		class="flex flex-col place-items-center place-content-center gap-4 px-4 text-immich-primary dark:text-immich-dark-primary"
	>
		<h1 class="text-2xl text-immich-primary dark:text-immich-dark-primary font-medium">
			Confirm User Deletion
		</h1>
	</div>
	<div>
		<p class="ml-4 text-md py-5 text-center">
			{user.firstName}
			{user.lastName} account and assets along will be marked to delete completely after 7 days. are
			you sure you want to proceed ?
		</p>

		<div class="flex w-full px-4 gap-4 mt-8">
			<button
				on:click={deleteUser}
				class="flex-1 transition-colors bg-red-500 hover:bg-red-400 px-6 py-3 text-white rounded-full w-full font-medium"
				>Confirm
			</button>
		</div>
	</div>
</div>
