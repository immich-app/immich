<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { AlbumResponseDto, api } from '@api';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';
	import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';

	export let album: AlbumResponseDto;

	const { getAssets, clearSelect } = getAssetControlContext();

	let isShowConfirmation = false;

	const removeFromAlbum = async () => {
		try {
			const { data } = await api.albumApi.removeAssetFromAlbum({
				id: album.id,
				removeAssetsDto: {
					assetIds: Array.from(getAssets()).map((a) => a.id)
				}
			});

			album = data;
			clearSelect();
		} catch (e) {
			console.error('Error [album-viewer] [removeAssetFromAlbum]', e);
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error removing assets from album, check console for more details'
			});
		} finally {
			isShowConfirmation = false;
		}
	};
</script>

<CircleIconButton
	title="Remove from album"
	on:click={() => (isShowConfirmation = true)}
	logo={DeleteOutline}
/>

{#if isShowConfirmation}
	<ConfirmDialogue
		title="Remove Asset{getAssets().size > 1 ? 's' : ''}"
		confirmText="Remove"
		on:confirm={removeFromAlbum}
		on:cancel={() => (isShowConfirmation = false)}
	>
		<svelte:fragment slot="prompt">
			<p>
				Are you sure you want to remove
				{#if getAssets().size > 1}
					these <b>{getAssets().size}</b> assets
				{:else}
					this asset
				{/if}
				from the album?
			</p>
		</svelte:fragment>
	</ConfirmDialogue>
{/if}
