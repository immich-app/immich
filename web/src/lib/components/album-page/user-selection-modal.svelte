<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { api, UserResponseDto } from '@api';
	import BaseModal from '../shared-components/base-modal.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';

	export let sharedUsersInAlbum: Set<UserResponseDto>;
	let users: UserResponseDto[] = [];
	let selectedUsers: UserResponseDto[] = [];

	const dispatch = createEventDispatcher();

	onMount(async () => {
		const { data } = await api.userApi.getAllUsers(false);

		users = data;

		// Remove the existed shared users from the album
		sharedUsersInAlbum.forEach((sharedUser) => {
			users = users.filter((user) => user.id !== sharedUser.id);
		});
	});

	const selectUser = (user: UserResponseDto) => {
		if (selectedUsers.includes(user)) {
			selectedUsers = selectedUsers.filter((selectedUser) => selectedUser.id !== user.id);
		} else {
			selectedUsers = [...selectedUsers, user];
		}
	};

	const deselectUser = (user: UserResponseDto) => {
		selectedUsers = selectedUsers.filter((selectedUser) => selectedUser.id !== user.id);
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<img src="/immich-logo.svg" width="24" alt="Immich" />
			<p class="font-medium text-immich-fg">Invite to album</p>
		</span>
	</svelte:fragment>

	<div class=" max-h-[400px] overflow-y-auto immich-scrollbar">
		{#if selectedUsers.length > 0}
			<div class="flex gap-4 py-2 px-5 overflow-x-auto place-items-center mb-2">
				<p class="font-medium">To</p>

				{#each selectedUsers as user}
					{#key user.id}
						<button
							on:click={() => deselectUser(user)}
							class="flex gap-1 place-items-center border border-gray-400 rounded-full p-1 hover:bg-gray-200 transition-colors"
						>
							<CircleAvatar size={28} {user} />
							<p class="text-xs font-medium">{user.firstName} {user.lastName}</p>
						</button>
					{/key}
				{/each}
			</div>
		{/if}

		{#if users.length > 0}
			<p class="text-xs font-medium px-5">SUGGESTIONS</p>

			<div class="my-4">
				{#each users as user}
					<button
						on:click={() => selectUser(user)}
						class="w-full flex place-items-center gap-4 py-4 px-5 hover:bg-gray-200  transition-all"
					>
						{#if selectedUsers.includes(user)}
							<span
								class="bg-immich-primary text-white rounded-full w-12 h-12 border flex place-items-center place-content-center text-3xl"
								>✓</span
							>
						{:else}
							<CircleAvatar {user} />
						{/if}

						<div class="text-left">
							<p class="text-immich-fg">
								{user.firstName}
								{user.lastName}
							</p>
							<p class="text-xs ">
								{user.email}
							</p>
						</div>
					</button>
				{/each}
			</div>
		{:else}
			<p class="text-sm px-5">
				Looks like you have shared this album with all users or you don't have any user to share
				with.
			</p>
		{/if}

		{#if selectedUsers.length > 0}
			<div class="flex place-content-end p-5 ">
				<button
					on:click={() => dispatch('add-user', { selectedUsers })}
					class="text-white bg-immich-primary px-4 py-2 rounded-lg text-sm font-bold transition-colors hover:bg-immich-primary/75"
					>Add</button
				>
			</div>
		{/if}
	</div>
</BaseModal>
