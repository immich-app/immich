<script lang="ts">
	import { createEventDispatcher, onMount } from 'svelte';
	import BaseModal from '../base-modal.svelte';
	import Link from 'svelte-material-icons/Link.svelte';
	import {
		AlbumResponseDto,
		api,
		AssetResponseDto,
		SharedLinkResponseDto,
		SharedLinkType
	} from '@api';
	import { notificationController, NotificationType } from '../notification/notification';
	import { ImmichDropDownOption } from '../dropdown-button.svelte';
	import SettingSwitch from '$lib/components/admin-page/settings/setting-switch.svelte';
	import DropdownButton from '../dropdown-button.svelte';
	import SettingInputField, {
		SettingInputFieldType
	} from '$lib/components/admin-page/settings/setting-input-field.svelte';
	import { handleError } from '$lib/utils/handle-error';
	import Button from '$lib/components/elements/buttons/button.svelte';

	export let shareType: SharedLinkType;
	export let sharedAssets: AssetResponseDto[] = [];
	export let album: AlbumResponseDto | undefined = undefined;
	export let editingLink: SharedLinkResponseDto | undefined = undefined;

	let isShowSharedLink = false;
	let expirationTime = '';
	let isAllowUpload = false;
	let sharedLink = '';
	let description = '';
	let shouldChangeExpirationTime = false;
	let isAllowDownload = true;
	let shouldShowExif = true;
	const dispatch = createEventDispatcher();

	const expiredDateOption: ImmichDropDownOption = {
		default: 'Never',
		options: ['Never', '30 minutes', '1 hour', '6 hours', '1 day', '7 days', '30 days']
	};

	onMount(() => {
		if (editingLink) {
			if (editingLink.description) {
				description = editingLink.description;
			}
			isAllowUpload = editingLink.allowUpload;
			isAllowDownload = editingLink.allowDownload;
			shouldShowExif = editingLink.showExif;
		}
	});

	const handleCreateSharedLink = async () => {
		const expirationTime = getExpirationTimeInMillisecond();
		const currentTime = new Date().getTime();
		const expirationDate = expirationTime
			? new Date(currentTime + expirationTime).toISOString()
			: undefined;

		try {
			if (shareType === SharedLinkType.Album && album) {
				const { data } = await api.albumApi.createAlbumSharedLink({
					createAlbumShareLinkDto: {
						albumId: album.id,
						expiresAt: expirationDate,
						allowUpload: isAllowUpload,
						description: description,
						allowDownload: isAllowDownload,
						showExif: shouldShowExif
					}
				});
				buildSharedLink(data);
			} else {
				const { data } = await api.assetApi.createAssetsSharedLink({
					createAssetsShareLinkDto: {
						assetIds: sharedAssets.map((a) => a.id),
						expiresAt: expirationDate,
						allowUpload: isAllowUpload,
						description: description,
						allowDownload: isAllowDownload,
						showExif: shouldShowExif
					}
				});
				buildSharedLink(data);
			}
		} catch (e) {
			handleError(e, 'Failed to create shared link');
		}

		isShowSharedLink = true;
	};

	const buildSharedLink = (createdLink: SharedLinkResponseDto) => {
		sharedLink = `${window.location.origin}/share/${createdLink.key}`;
	};

	const handleCopy = async () => {
		try {
			await navigator.clipboard.writeText(sharedLink);
			notificationController.show({
				message: 'Copied to clipboard!',
				type: NotificationType.Info
			});
		} catch (e) {
			handleError(
				e,
				'Cannot copy to clipboard, make sure you are accessing the page through https'
			);
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

	const handleEditLink = async () => {
		if (editingLink) {
			try {
				const expirationTime = getExpirationTimeInMillisecond();
				const currentTime = new Date().getTime();
				const expirationDate: string | null = expirationTime
					? new Date(currentTime + expirationTime).toISOString()
					: null;

				await api.shareApi.editSharedLink({
					id: editingLink.id,
					editSharedLinkDto: {
						description,
						expiresAt: shouldChangeExpirationTime ? expirationDate : undefined,
						allowUpload: isAllowUpload,
						allowDownload: isAllowDownload,
						showExif: shouldShowExif
					}
				});

				notificationController.show({
					type: NotificationType.Info,
					message: 'Edited'
				});

				dispatch('close');
			} catch (e) {
				handleError(e, 'Failed to edit shared link');
			}
		}
	};
</script>

<BaseModal on:close={() => dispatch('close')}>
	<svelte:fragment slot="title">
		<span class="flex gap-2 place-items-center">
			<Link size={24} />
			{#if editingLink}
				<p class="font-medium text-immich-fg dark:text-immich-dark-fg">Edit link</p>
			{:else}
				<p class="font-medium text-immich-fg dark:text-immich-dark-fg">Create link to share</p>
			{/if}
		</span>
	</svelte:fragment>

	<section class="mx-6 mb-6">
		{#if shareType == SharedLinkType.Album}
			{#if !editingLink}
				<div>Let anyone with the link see photos and people in this album.</div>
			{:else}
				<div class="text-sm">
					Public album | <span class="text-immich-primary dark:text-immich-dark-primary"
						>{editingLink.album?.albumName}</span
					>
				</div>
			{/if}
		{/if}

		{#if shareType == SharedLinkType.Individual}
			{#if !editingLink}
				<div>Let anyone with the link see the selected photo(s)</div>
			{:else}
				<div class="text-sm">
					Individual shared | <span class="text-immich-primary dark:text-immich-dark-primary"
						>{editingLink.description}</span
					>
				</div>
			{/if}
		{/if}

		<div class="mt-4 mb-2">
			<p class="text-xs">LINK OPTIONS</p>
		</div>
		<div class="p-4 bg-gray-100 dark:bg-black/40 rounded-lg">
			<div class="flex flex-col">
				<div class="mb-2">
					<SettingInputField
						inputType={SettingInputFieldType.TEXT}
						label="Description"
						bind:value={description}
					/>
				</div>

				<div class="my-3">
					<SettingSwitch bind:checked={shouldShowExif} title={'Show metadata'} />
				</div>

				<div class="my-3">
					<SettingSwitch bind:checked={isAllowDownload} title={'Allow public user to download'} />
				</div>

				<div class="my-3">
					<SettingSwitch bind:checked={isAllowUpload} title={'Allow public user to upload'} />
				</div>

				<div class="text-sm">
					{#if editingLink}
						<p class="my-2 immich-form-label">
							<SettingSwitch
								bind:checked={shouldChangeExpirationTime}
								title={'Change expiration time'}
							/>
						</p>
					{:else}
						<p class="my-2 immich-form-label">Expire after</p>
					{/if}

					<DropdownButton
						options={expiredDateOption}
						bind:selected={expirationTime}
						disabled={editingLink && !shouldChangeExpirationTime}
					/>
				</div>
			</div>
		</div>
	</section>

	<hr />

	<section class="m-6">
		{#if !isShowSharedLink}
			{#if editingLink}
				<div class="flex justify-end">
					<Button size="sm" rounded="lg" on:click={handleEditLink}>Confirm</Button>
				</div>
			{:else}
				<div class="flex justify-end">
					<Button size="sm" rounded="lg" on:click={handleCreateSharedLink}>Create link</Button>
				</div>
			{/if}
		{/if}

		{#if isShowSharedLink}
			<div class="flex w-full gap-4">
				<input class="immich-form-input w-full" bind:value={sharedLink} disabled />

				<Button on:click={() => handleCopy()}>Copy</Button>
			</div>
		{/if}
	</section>
</BaseModal>
