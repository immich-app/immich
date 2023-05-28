<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AlbumResponseDto, api, SharedLinkResponseDto, UserResponseDto } from '@api';
	import BaseModal from '../shared-components/base-modal.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import Link from 'svelte-material-icons/Link.svelte';
	import ShareCircle from 'svelte-material-icons/ShareCircle.svelte';
	import { goto } from '$app/navigation';
	import ImmichLogo from '../shared-components/immich-logo.svelte';
	import Button from '../elements/buttons/button.svelte';
	import { AppRoute } from '$lib/constants';

	export let album: AlbumResponseDto;
	export let sharedUsersInAlbum: Set<UserResponseDto>;
	let users: UserResponseDto[] = [];
	let selectedUsers: UserResponseDto[] = [];

	const dispatch = createEventDispatcher();
	let sharedLinks: SharedLinkResponseDto[] = [];
	onMount(async () => {
		await getSharedLinks();
		const { data } = await api.userApi.getAllUsers({ isAll: false });

		// remove invalid users
		users = data.filter((user) => !(user.deletedAt || user.id === album.ownerId));

		// Remove the existed shared users from the album
		sharedUsersInAlbum.forEach((sharedUser) => {
			users = users.filter((user) => user.id !== sharedUser.id);
		});
	});

	const getSharedLinks = async () => {
		const { data } = await api.shareApi.getAllSharedLinks();

		sharedLinks = data.filter((link) => link.album?.id === album.id);
	};

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

	const onSharedLinkClick = () => {
		dispatch('sharedlinkclick');
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<ImmichLogo width={24} />
			<p class="font-medium">Invite to album</p>
		</span>
	</svelte:fragment>

	<div class="max-h-[300px] overflow-y-auto immich-scrollbar">
		{#if selectedUsers.length > 0}
			<div class="flex gap-4 py-2 px-5 overflow-x-auto place-items-center mb-2">
				<p class="font-medium">To</p>

				{#each selectedUsers as user}
					{#key user.id}
						<button
							on:click={() => deselectUser(user)}
							class="flex gap-1 place-items-center border border-gray-400 rounded-full p-1 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
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
						class="w-full flex place-items-center gap-4 py-4 px-5 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
					>
						{#if selectedUsers.includes(user)}
							<span
								class="bg-immich-primary dark:bg-immich-dark-primary text-white dark:text-immich-dark-bg rounded-full w-12 h-12 border flex place-items-center place-content-center text-3xl dark:border-immich-dark-gray"
								>✓</span
							>
						{:else}
							<CircleAvatar {user} />
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
			</div>
		{:else}
			<p class="text-sm p-5">
				Looks like you have shared this album with all users or you don't have any user to share
				with.
			</p>
		{/if}

		{#if selectedUsers.length > 0}
			<div class="flex place-content-end p-5">
				<Button size="sm" rounded="lg" on:click={() => dispatch('add-user', { selectedUsers })}>
					Add
				</Button>
			</div>
		{/if}
	</div>

	<hr />
	<div id="shared-buttons" class="flex my-4 justify-around place-items-center place-content-center">
		<button
			class="flex flex-col gap-2 place-items-center place-content-center hover:cursor-pointer"
			on:click={onSharedLinkClick}
		>
			<Link size={24} />
			<p class="text-sm">Create link</p>
		</button>

		{#if sharedLinks.length}
			<button
				class="flex flex-col gap-2 place-items-center place-content-center hover:cursor-pointer"
				on:click={() => goto(AppRoute.SHARED_LINKS)}
			>
				<ShareCircle size={24} />
				<p class="text-sm">View links</p>
			</button>
		{/if}
	</div>
</BaseModal>
