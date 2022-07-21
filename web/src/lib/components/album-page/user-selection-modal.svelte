<script lang="ts">
	import { fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { createEventDispatcher, onMount } from 'svelte';
	import { api, UserResponseDto } from '@api';
	import AlbumAppBar from './album-app-bar.svelte';
	import BaseModal from '../shared-components/base-modal.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import { size, template } from 'lodash';

	let users: UserResponseDto[] = [];
	let selectedUsers: Set<UserResponseDto> = new Set();

	const dispatch = createEventDispatcher();

	onMount(async () => {
		const { data } = await api.userApi.getAllUsers(false);

		users = data;
	});

	const selectUser = (user: UserResponseDto) => {
		const tempSelectedUsers = new Set(selectedUsers);

		if (selectedUsers.has(user)) {
			tempSelectedUsers.delete(user);
		} else {
			tempSelectedUsers.add(user);
		}

		selectedUsers = tempSelectedUsers;
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<img src="/immich-logo.svg" width="24" alt="Immich" />
			<p class="font-medium text-immich-fg">Invite to album</p>
		</span>
	</svelte:fragment>

	<div class="max-h-[400px] overflow-y-auto immich-scrollbar">
		{#if selectedUsers.size > 0}
			<div class="flex gap-4 py-2 px-5 overflow-x-auto place-items-center mb-2">
				<p>To</p>

				{#each Array.from(selectedUsers) as user}
					<button
						class="flex gap-1 place-items-center border border-gray-400 rounded-full p-1 hover:bg-gray-200 transition-colors"
					>
						<CircleAvatar size={28} {user} />
						<p class="text-xs">{user.firstName} {user.lastName}</p>
					</button>
				{/each}
			</div>
		{/if}
		<p class="text-xs font-medium px-5">SUGGESTIONS</p>
		<div class="my-4">
			{#each users as user}
				<button
					on:click={() => selectUser(user)}
					class="w-full flex place-items-center gap-4 py-4 px-5 hover:bg-gray-200  transition-all"
				>
					{#if selectedUsers.has(user)}
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
	</div>
</BaseModal>
