<script lang="ts">
	import ControlAppBar from '$lib/components/shared-components/control-app-bar.svelte';
	import ArrowLeft from 'svelte-material-icons/ArrowLeft.svelte';

	import { api, SharedLinkResponseDto } from '@api';
	import { goto } from '$app/navigation';
	import SharedLinkCard from '$lib/components/sharedlinks-page/shared-link-card.svelte';
	import {
		notificationController,
		NotificationType
	} from '$lib/components/shared-components/notification/notification';
	import { onMount } from 'svelte';
	import CreateSharedLinkModal from '$lib/components/shared-components/create-share-link-modal/create-shared-link-modal.svelte';

	let sharedLinks: SharedLinkResponseDto[] = [];
	let showEditForm = false;
	let editSharedLink: SharedLinkResponseDto;

	onMount(async () => {
		sharedLinks = await getSharedLinks();
	});

	const getSharedLinks = async () => {
		const { data: sharedLinks } = await api.shareApi.getAllSharedLinks();

		return sharedLinks;
	};

	const handleDeleteLink = async (linkId: string) => {
		if (window.confirm('Do you want to delete the shared link? ')) {
			try {
				await api.shareApi.removeSharedLink({ id: linkId });
				notificationController.show({
					message: 'Shared link deleted',
					type: NotificationType.Info
				});

				sharedLinks = await getSharedLinks();
			} catch (e) {
				console.error(e);
				notificationController.show({
					message: 'Failed to delete shared link',
					type: NotificationType.Error
				});
			}
		}
	};

	const handleEditLink = async (id: string) => {
		const { data } = await api.shareApi.getSharedLinkById({ id });
		editSharedLink = data;
		showEditForm = true;
	};

	const handleEditDone = async () => {
		sharedLinks = await getSharedLinks();
		showEditForm = false;
	};

	const handleCopy = async (key: string) => {
		const link = `${window.location.origin}/share/${key}`;
		await navigator.clipboard.writeText(link);
		notificationController.show({
			message: 'Link copied to clipboard',
			type: NotificationType.Info
		});
	};
</script>

<ControlAppBar backIcon={ArrowLeft} on:close-button-click={() => goto('/sharing')}>
	<svelte:fragment slot="leading">Shared links</svelte:fragment>
</ControlAppBar>

<section class="flex flex-col pb-[120px] mt-[120px]">
	<div class="w-[50%] m-auto mb-4 dark:text-immich-gray">
		<p>Manage shared links</p>
	</div>
	{#if sharedLinks.length === 0}
		<div
			class="w-[50%] m-auto bg-gray-100 flex place-items-center place-content-center rounded-lg p-12"
		>
			<p>You don't have any shared links</p>
		</div>
	{:else}
		<div class="flex flex-col w-[50%] m-auto">
			{#each sharedLinks as link (link.id)}
				<SharedLinkCard
					{link}
					on:delete={() => handleDeleteLink(link.id)}
					on:edit={() => handleEditLink(link.id)}
					on:copy={() => handleCopy(link.key)}
				/>
			{/each}
		</div>
	{/if}
</section>

{#if showEditForm}
	<CreateSharedLinkModal
		editingLink={editSharedLink}
		shareType={editSharedLink.type}
		album={editSharedLink.album}
		on:close={handleEditDone}
	/>
{/if}
