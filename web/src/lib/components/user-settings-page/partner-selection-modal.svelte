<script lang="ts">
	import { api, UserResponseDto } from '@api';
	import BaseModal from '../shared-components/base-modal.svelte';
	import UserAvatar from '../shared-components/user-avatar.svelte';
	import ImmichLogo from '../shared-components/immich-logo.svelte';
	import Button from '../elements/buttons/button.svelte';
	import { createEventDispatcher, onMount } from 'svelte';

	export let user: UserResponseDto;

	let availableUsers: UserResponseDto[] = [];
	let selectedUsers: UserResponseDto[] = [];

	const dispatch = createEventDispatcher<{ close: void; 'add-users': UserResponseDto[] }>();

	onMount(async () => {
		// TODO: update endpoint to have a query param for deleted users
		let { data: users } = await api.userApi.getAllUsers({ isAll: false });

		// remove invalid users
		users = users.filter((_user) => !(_user.deletedAt || _user.id === user.id));

		// exclude partners from the list of users available for selection
		const { data: partners } = await api.partnerApi.getPartners({ direction: 'shared-by' });
		const partnerIds = partners.map((partner) => partner.id);
		availableUsers = users.filter((user) => !partnerIds.includes(user.id));
	});

	const selectUser = (user: UserResponseDto) => {
		if (selectedUsers.includes(user)) {
			selectedUsers = selectedUsers.filter((selectedUser) => selectedUser.id !== user.id);
		} else {
			selectedUsers = [...selectedUsers, user];
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<ImmichLogo width={24} />
			<p class="font-medium">Add partner</p>
		</span>
	</svelte:fragment>

	<div class="max-h-[300px] overflow-y-auto immich-scrollbar">
		{#if availableUsers.length > 0}
			{#each availableUsers as user}
				<button
					on:click={() => selectUser(user)}
					class="w-full flex place-items-center gap-4 py-4 px-5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
				>
					{#if selectedUsers.includes(user)}
						<span
							class="bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-bg rounded-full w-12 h-12 border flex place-items-center place-content-center text-3xl dark:border-immich-dark-gray"
							>✓</span
						>
					{:else}
						<UserAvatar {user} size="md" autoColor />
					{/if}

					<div class="text-left">
						<p class="text-immich-fg dark:text-immich-dark-fg">
							{user.firstName}
							{user.lastName}
						</p>
						<p class="text-xs">
							{user.email}
						</p>
					</div>
				</button>
			{/each}
		{:else}
			<p class="text-sm p-5">
				Looks like you shared your photos with all users or you don't have any user to share with.
			</p>
		{/if}

		{#if selectedUsers.length > 0}
			<div class="flex place-content-end p-5">
				<Button size="sm" rounded="lg" on:click={() => dispatch('add-users', selectedUsers)}>
					Add
				</Button>
			</div>
		{/if}
	</div>
</BaseModal>
