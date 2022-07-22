<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AlbumResponseDto, api, UserResponseDto } from '@api';
	import BaseModal from '../shared-components/base-modal.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';

	export let album: AlbumResponseDto;
	let users: UserResponseDto[] = [];
	let selectedUsers: Set<UserResponseDto> = new Set();

	const dispatch = createEventDispatcher();

	// onMount(async () => {
	// 	const { data } = await api.userApi.getAllUsers(false);

	// 	users = data;

	// 	// Remove the existed shared users from the album
	// 	sharedUsersInAlbum.forEach((sharedUser) => {
	// 		users = users.filter((user) => user.id !== sharedUser.id);
	// 	});
	// });
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<p class="font-medium text-immich-fg">Options</p>
		</span>
	</svelte:fragment>

	<section class="max-h-[400px] overflow-y-auto immich-scrollbar pb-4">
		{#each album.sharedUsers as user}
			<div
				class="flex gap-4 p-5 place-items-center justify-between w-full transition-colors hover:bg-gray-50"
			>
				<div class="flex gap-4 place-items-center">
					<CircleAvatar {user} />
					<p class="font-medium text-sm">{user.firstName} {user.lastName}</p>
				</div>

				<div>
					<CircleIconButton
						logo={DotsVertical}
						backgroundColor={'transparent'}
						logoColor={'#5f6368'}
						hoverColor={'#e2e7e9'}
						size={'20'}
					/>
				</div>
			</div>
		{/each}
	</section>
</BaseModal>
