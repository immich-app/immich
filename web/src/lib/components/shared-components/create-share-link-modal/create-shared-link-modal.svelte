<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BaseModal from '../base-modal.svelte';
	import Link from 'svelte-material-icons/Link.svelte';
	import { AlbumResponseDto, api, SharedLinkResponseDto, SharedLinkType } from '@api';
	import { notificationController, NotificationType } from '../notification/notification';
	import { ImmichDropDownOption } from '../dropdown-button.svelte';
	import SettingSwitch from '$lib/components/admin-page/settings/setting-switch.svelte';
	import DropdownButton from '../dropdown-button.svelte';
	import SettingInputField, {
		SettingInputFieldType
	} from '$lib/components/admin-page/settings/setting-input-field.svelte';

	export let shareType: SharedLinkType;
	export let album: AlbumResponseDto | undefined;

	let isLoading = false;
	let isShowSharedLink = false;
	let expirationTime = '';
	let isAllowUpload = false;
	let sharedLink = '';
	let description = '';
	const expiredDateOption: ImmichDropDownOption = {
		default: 'Never',
		options: ['Never', '30 minutes', '1 hour', '6 hours', '1 day', '7 days', '30 days']
	};
	const dispatch = createEventDispatcher();

	onMount(async () => {
		const { data } = await api.shareApi.getAllSharedLinks();
		console.log('My data', data);
	});

	const createAlbumSharedLink = async () => {
		if (album) {
			isLoading = true;
			try {
				const expirationTime = getExpirationTimeInMillisecond();
				const currentTime = new Date().getTime();
				const expirationDate = expirationTime
					? new Date(currentTime + expirationTime).toISOString()
					: undefined;

				const { data } = await api.albumApi.createAlbumSharedLink({
					albumId: album.id,
					expiredAt: expirationDate,
					allowUpload: isAllowUpload,
					description: description
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
			await navigator.clipboard.writeText(sharedLink);
			notificationController.show({
				message: 'Copied to clipboard!',
				type: NotificationType.Info
			});
		} catch (error) {
			console.error('Error', error);
		}
	};

	const getExpirationTimeInMillisecond = () => {
		switch (expirationTime) {
			case '30 minutes':
				return 30 * 60 * 1000;
			case '1 hour':
				return 60 * 60 * 1000;
			case '6 hours':
				return 6 * 60 * 60 * 1000;
			case '1 day':
				return 24 * 60 * 60 * 1000;
			case '7 days':
				return 7 * 24 * 60 * 60 * 1000;
			case '30 days':
				return 30 * 24 * 60 * 60 * 1000;
			default:
				return 0;
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

		<div class="mt-6 mb-2">
			<p class="text-xs">LINK OPTIONS</p>
		</div>
		<div class="p-4 bg-gray-100 dark:bg-black/40 rounded-lg">
			<div class="flex flex-col">
				<div class="mb-4">
					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="Description"
						bind:value={description}
					/>
				</div>

				<SettingSwitch bind:checked={isAllowUpload} title={'Allow public user to upload'} />

				<div class="text-sm mt-4">
					<p class="my-2">Expire after</p>
					<DropdownButton options={expiredDateOption} bind:selected={expirationTime} />
				</div>
			</div>
		</div>
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
			<div class="flex w-full gap-4">
				<input class="immich-form-input w-full" bind:value={sharedLink} />

				<button
					on:click={() => handleCopy()}
					class="flex-1 transition-colors bg-immich-primary dark:bg-immich-dark-primary hover:bg-immich-primary/75 dark:hover:bg-immich-dark-primary/80 dark:text-immich-dark-gray px-6 py-2 text-white rounded-full shadow-md w-full font-medium"
					>Copy</button
				>
			</div>
		{/if}
	</section>
</BaseModal>
