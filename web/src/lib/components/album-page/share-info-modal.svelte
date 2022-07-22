<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import { AlbumResponseDto, api, UserResponseDto } from '@api';
	import BaseModal from '../shared-components/base-modal.svelte';
	import CircleAvatar from '../shared-components/circle-avatar.svelte';
	import DotsVertical from 'svelte-material-icons/DotsVertical.svelte';
	import CircleIconButton from '../shared-components/circle-icon-button.svelte';
	import ContextMenu from '../shared-components/context-menu/context-menu.svelte';
	import MenuOption from '../shared-components/context-menu/menu-option.svelte';

	export let album: AlbumResponseDto;

	let isShowMenu = false;
	let position = { x: 0, y: 0 };
	const dispatch = createEventDispatcher();

	const showContextMenu = (userId: string) => {
		const iconButton = document.getElementById('icon-' + userId);

		if (iconButton) {
			position = {
				x: iconButton.getBoundingClientRect().left,
				y: iconButton.getBoundingClientRect().bottom
			};
		}
		isShowMenu = !isShowMenu;
	};
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

				<div id={`icon-${user.id}`}>
					<CircleIconButton
						on:click={() => showContextMenu(user.id)}
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

	{#if isShowMenu}
		<ContextMenu {...position} on:clickoutside={() => (isShowMenu = false)}>
			<MenuOption on:click={() => console.log('Remove')} text="Remove" />
			<MenuOption on:click={() => console.log('Info')} text="Info" />
			<MenuOption on:click={() => console.log('More')} text="More" />
		</ContextMenu>
	{/if}
</BaseModal>
