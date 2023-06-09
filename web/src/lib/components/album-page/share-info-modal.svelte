<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AlbumResponseDto, api, UserResponseDto } from '@api';
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
	import { handleError } from '../../utils/handle-error';
	import ConfirmDialogue from '../shared-components/confirm-dialogue.svelte';

	export let album: AlbumResponseDto;

	const dispatch = createEventDispatcher();

	let currentUser: UserResponseDto;
	let position = { x: 0, y: 0 };
	let selectedMenuUser: UserResponseDto | null = null;
	let selectedRemoveUser: UserResponseDto | null = null;

	$: isOwned = currentUser?.id == album.ownerId;

	onMount(async () => {
		try {
			const { data } = await api.userApi.getMyUserInfo();
			currentUser = data;
		} catch (e) {
			handleError(e, 'Unable to refresh user');
		}
	});

	const showContextMenu = (user: UserResponseDto) => {
		const iconButton = document.getElementById('icon-' + user.id);

		if (iconButton) {
			position = {
				x: iconButton.getBoundingClientRect().left,
				y: iconButton.getBoundingClientRect().bottom
			};
		}

		selectedMenuUser = user;
		selectedRemoveUser = null;
	};

	const handleMenuRemove = () => {
		selectedRemoveUser = selectedMenuUser;
		selectedMenuUser = null;
	};

	const handleRemoveUser = async () => {
		if (!selectedRemoveUser) {
			return;
		}

		const userId = selectedRemoveUser.id === currentUser?.id ? 'me' : selectedRemoveUser.id;

		try {
			await api.albumApi.removeUserFromAlbum({ id: album.id, userId });
			dispatch('user-deleted', { userId });
			const message =
				userId === 'me' ? `Left ${album.albumName}` : `Removed ${selectedRemoveUser.firstName}`;
			notificationController.show({ type: NotificationType.Info, message });
		} catch (e) {
			handleError(e, 'Unable to remove user');
		} finally {
			selectedRemoveUser = null;
		}
	};
</script>

{#if !selectedRemoveUser}
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
							<div>
								<CircleIconButton
									on:click={() => showContextMenu(user)}
									logo={DotsVertical}
									backgroundColor="transparent"
									hoverColor="#e2e7e9"
									size="20"
								/>

								{#if selectedMenuUser === user}
									<ContextMenu {...position} on:outclick={() => (selectedMenuUser = null)}>
										<MenuOption on:click={handleMenuRemove} text="Remove" />
									</ContextMenu>
								{/if}
							</div>
						{:else if user.id == currentUser?.id}
							<button
								on:click={() => (selectedRemoveUser = user)}
								class="text-sm text-immich-primary dark:text-immich-dark-primary font-medium transition-colors hover:text-immich-primary/75"
								>Leave</button
							>
						{/if}
					</div>
				</div>
			{/each}
		</section>
	</BaseModal>
{/if}

{#if selectedRemoveUser && selectedRemoveUser?.id === currentUser?.id}
	<ConfirmDialogue
		title="Leave Album?"
		prompt="Are you sure you want to leave {album.albumName}?"
		confirmText="Leave"
		on:confirm={handleRemoveUser}
		on:cancel={() => (selectedRemoveUser = null)}
	/>
{/if}

{#if selectedRemoveUser && selectedRemoveUser?.id !== currentUser?.id}
	<ConfirmDialogue
		title="Remove User?"
		prompt="Are you sure you want to remove {selectedRemoveUser.firstName} {selectedRemoveUser.lastName}"
		confirmText="Remove"
		on:confirm={handleRemoveUser}
		on:cancel={() => (selectedRemoveUser = null)}
	/>
{/if}
