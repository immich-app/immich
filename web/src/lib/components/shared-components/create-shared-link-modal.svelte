<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BaseModal from './base-modal.svelte';
	import Link from 'svelte-material-icons/Link.svelte';
	import { AlbumResponseDto, api, SharedLinkResponseDto, SharedLinkType } from '@api';
	import { notificationController, NotificationType } from './notification/notification';

	export let shareType: SharedLinkType;
	export let album: AlbumResponseDto | undefined;

	let isLoading = false;
	let isShowSharedLink = false;
	let sharedLink = '';
	const dispatch = createEventDispatcher();

	onMount(async () => {
		const { data } = await api.shareApi.getAllSharedLinks();
		console.log('My data', data);
	});

	const createAlbumSharedLink = async () => {
		if (album) {
			isLoading = true;
			try {
				const { data } = await api.shareApi.createSharedLink({
					albumId: album.id,
					sharedType: shareType,
					assetIds: []
				});

				buildSharedLink(data);
				isLoading = false;
				isShowSharedLink = true;
			} catch (e) {
				console.error('[createAlbumSharedLink] Error: ', e);
				notificationController.show({
					type: NotificationType.Error,
					message: 'Failed to create shared link'
				});
				isLoading = false;
			}
		}
	};

	const buildSharedLink = (createdLink: SharedLinkResponseDto) => {
		sharedLink = `${window.location.origin}/share/${createdLink.id}`;
	};

	const handleCopy = async () => {
		try {
			console.log(navigator);
			await navigator.clipboard.writeText(sharedLink);
			notificationController.show({
				message: 'Copied to clipboard!',
				type: NotificationType.Info
			});
		} catch (error) {
			console.error('Error', error);
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<Link size={24} />
			<p class="font-medium text-immich-fg dark:text-immich-dark-fg">Create link to share</p>
		</span>
	</svelte:fragment>

	<section class="mx-6 mt-2 mb-8">
		{#if shareType == SharedLinkType.Album}
			<div>Let anyone with the link see photos and people in this album.</div>
		{/if}
	</section>

	<hr />

	<section class="m-6">
		{#if !isShowSharedLink}
			<div class="flex justify-end">
				<button
					on:click={createAlbumSharedLink}
					class="text-white bg-immich-primary px-4 py-2 rounded-lg text-sm transition-colors hover:bg-immich-primary/75"
				>
					Create Link
				</button>
			</div>
		{/if}

		{#if isShowSharedLink}
			<div class="flex w-full">
				<input class="immich-form-input w-full" bind:value={sharedLink} />
				<button
					on:click={() => handleCopy()}
					class="flex-1 transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-3 text-white rounded-full shadow-md w-full font-medium"
					>Copy to Clipboard</button
				>
			</div>
		{/if}
	</section>
</BaseModal>
