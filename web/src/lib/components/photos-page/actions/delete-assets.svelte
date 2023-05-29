<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import { OnAssetDelete, getAssetControlContext } from '../asset-select-control-bar.svelte';
	import ConfirmDialogue from '$lib/components/shared-components/confirm-dialogue.svelte';
	import { handleError } from '../../../utils/handle-error';

	export let onAssetDelete: OnAssetDelete;
	const { getAssets, clearSelect } = getAssetControlContext();

	let confirm = false;

	const handleDelete = async () => {
		try {
			let count = 0;

			const { data: deletedAssets } = await api.assetApi.deleteAsset({
				deleteAssetDto: {
					ids: Array.from(getAssets()).map((a) => a.id)
				}
			});

			for (const asset of deletedAssets) {
				if (asset.status === 'SUCCESS') {
					onAssetDelete(asset.id);
					count++;
				}
			}

			notificationController.show({ message: `Deleted ${count}`, type: NotificationType.Info });

			clearSelect();
		} catch (e) {
			handleError(e, 'Error deleting assets');
		}
	};
</script>

<CircleIconButton title="Delete" logo={DeleteOutline} on:click={() => (confirm = true)} />

{#if confirm}
	<ConfirmDialogue
		prompt="Are you sure you want to delete {getAssets()
			.size} assets? This step also deletes assets in the album(s) to which they belong. You can not undo this action!"
		title="Delete assets?"
		confirmText="Delete"
		on:confirm={handleDelete}
		on:cancel={() => (confirm = false)}
	/>
{/if}
