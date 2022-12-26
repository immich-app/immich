<script lang="ts">
	import { goto } from '$app/navigation';
	import { oauth, OAuthConfigResponseDto, UserResponseDto } from '@api';
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { handleError } from '../../utils/handle-error';
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

				const { data } = await oauth.link(window.location);
				user = data;

				notificationController.show({
					message: 'Linked OAuth account',
					type: NotificationType.Info
				});
			} catch (error) {
				handleError(error, 'Unable to link OAuth account');
			} finally {
				goto('?open=oauth');
			}
		}

		try {
			const { data } = await oauth.getConfig(window.location);
			config = data;
		} catch (error) {
			handleError(error, 'Unable to load OAuth config');
		}

		loading = false;
	});

	const handleUnlink = async () => {
		try {
			const { data } = await oauth.unlink();
			user = data;
			notificationController.show({
				message: 'Unlinked OAuth account',
				type: NotificationType.Info
			});
		} catch (error) {
			handleError(error, 'Unable to unlink account');
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
