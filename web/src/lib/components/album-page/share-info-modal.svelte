<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AlbumResponseDto, api, UserResponseDto } from '@api';
	import { clickOutside } from '$lib/utils/click-outside';
	import BaseModal from '../shared-components/base-modal.svelte';
	import UserAvatar from '../shared-components/user-avatar.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import CircleIconButton from '../elements/buttons/circle-icon-button.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let album: AlbumResponseDto;

	const dispatch = createEventDispatcher();

	let currentUser: UserResponseDto;
	let isShowMenu = false;
	let position = { x: 0, y: 0 };
	let targetUserId: string;
	$: isOwned = currentUser?.id == album.ownerId;

	onMount(async () => {
		try {
			const { data } = await api.userApi.getMyUserInfo();
			currentUser = data;
		} catch (e) {
			console.error('Error [share-info-modal] [getAllUsers]', e);
			notificationController.show({
				message: 'Error getting user info, check console for more details',
				type: NotificationType.Error
			});
		}
	});

	const showContextMenu = (userId: string) => {
		const iconButton = document.getElementById('icon-' + userId);

		if (iconButton) {
			position = {
				x: iconButton.getBoundingClientRect().left,
				y: iconButton.getBoundingClientRect().bottom
			};
		}

		targetUserId = userId;
		isShowMenu = !isShowMenu;
	};

	const removeUser = async (userId: string) => {
		if (window.confirm('Do you want to remove selected user from the album?')) {
			try {
				await api.albumApi.removeUserFromAlbum({ id: album.id, userId });
				dispatch('user-deleted', { userId });
			} catch (e) {
				console.error('Error [share-info-modal] [removeUser]', e);
				notificationController.show({
					message: 'Error removing user, check console for more details',
					type: NotificationType.Error
				});
			}
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<p class="font-medium text-immich-fg dark:text-immich-dark-fg">Options</p>
		</span>
	</svelte:fragment>

	<section class="max-h-[400px] overflow-y-auto immich-scrollbar pb-4">
		{#each album.sharedUsers as user}
			<div
				class="flex gap-4 p-5 place-items-center justify-between w-full transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
			>
				<div class="flex gap-4 place-items-center">
					<UserAvatar {user} size="md" autoColor />
					<p class="font-medium text-sm">{user.firstName} {user.lastName}</p>
				</div>

				<div id={`icon-${user.id}`} class="flex place-items-center">
					{#if isOwned}
						<div use:clickOutside on:outclick={() => (isShowMenu = false)}>
							<CircleIconButton
								on:click={() => showContextMenu(user.id)}
								logo={DotsVertical}
								backgroundColor={'transparent'}
								hoverColor={'#e2e7e9'}
								size={'20'}
							>
								{#if isShowMenu}
									<ContextMenu {...position}>
										<MenuOption on:click={() => removeUser(targetUserId)} text="Remove" />
									</ContextMenu>
								{/if}
							</CircleIconButton>
						</div>
					{:else if user.id == currentUser?.id}
						<button
							on:click={() => removeUser('me')}
							class="text-sm text-immich-primary dark:text-immich-dark-primary font-medium transition-colors hover:text-immich-primary/75"
							>Leave</button
						>
					{/if}
				</div>
			</div>
		{/each}
	</section>
</BaseModal>
