<script lang="ts">
	import { goto } from '$app/navigation';
	import { ApiError, oauth, OAuthConfigResponseDto, UserResponseDto } from '@api';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import LoadingSpinner from '../shared-components/loading-spinner.svelte';
	import {
		notificationController,
		NotificationType
	} from '../shared-components/notification/notification';

	export let user: UserResponseDto;

	let config: OAuthConfigResponseDto = { enabled: false };
	let loading = true;

	onMount(async () => {
		if (oauth.isCallback(window.location)) {
			try {
				loading = true;

				await oauth.link(window.location);
				//  TODO: bug with user update
				user = { ...user, oauthId: 'true' };
				goto('?open=oauth');

				notificationController.show({
					message: 'Linked OAuth account',
					type: NotificationType.Info
				});
			} catch (e) {
				notificationController.show({
					message: 'Unable to link OAuth account',
					type: NotificationType.Error
				});
			}
		}

		try {
			const { data } = await oauth.getConfig(window.location);
			config = data;
		} catch (e) {
			notificationController.show({
				message: 'Unable to load OAuth config',
				type: NotificationType.Error
			});
		}

		loading = false;
	});

	const handleUnlink = async () => {
		try {
			await oauth.unlink();
			//  TODO: bug with user update
			user = { ...user, oauthId: '' };
			notificationController.show({
				message: 'Unlinked OAuth account',
				type: NotificationType.Info
			});
		} catch (error) {
			console.error('Error [user-profile:oauth-settings] [unlink]', error);
			notificationController.show({
				message: (error as ApiError)?.response?.data?.message || 'Unable to unlink account',
				type: NotificationType.Error
			});
		}
	};
</script>

<section class="my-4">
	<div in:fade={{ duration: 500 }}>
		<div class="flex justify-end">
			{#if loading}
				<div class="flex place-items-center place-content-center">
					<LoadingSpinner />
				</div>
			{:else if config.enabled}
				{#if user.oauthId}
					<button
						on:click={() => handleUnlink()}
						class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
						>Unlink OAuth
					</button>
				{:else}
					<a href={config.url}>
						<button
							class="text-sm bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 px-4 py-2 text-white dark:text-immich-dark-gray rounded-full shadow-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
							>Link to OAuth</button
						>
					</a>
				{/if}
			{/if}
		</div>
	</div>
</section>
