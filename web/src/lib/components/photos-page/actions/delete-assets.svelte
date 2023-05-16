<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import DeleteOutline from 'svelte-material-icons/DeleteOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	const { assets, clearSelect, removeAsset } = getAssetControlContext();

	const deleteSelectedAssetHandler = async () => {
		try {
			if (
				window.confirm(
					`Caution! Are you sure you want to delete ${assets.size} assets? This step also deletes assets in the album(s) to which they belong. You can not undo this action!`
				)
			) {
				const { data: deletedAssets } = await api.assetApi.deleteAsset({
					ids: Array.from(assets).map((a) => a.id)
				});

				for (const asset of deletedAssets) {
					if (asset.status === 'SUCCESS') {
						removeAsset?.(asset.id);
					}
				}

				clearSelect();
			}
		} catch (e) {
			notificationController.show({
				type: NotificationType.Error,
				message: 'Error deleting assets, check console for more details'
			});
			console.error('Error deleteSelectedAssetHandler', e);
		}
	};
</script>

<CircleIconButton title="Delete" logo={DeleteOutline} on:click={deleteSelectedAssetHandler} />
