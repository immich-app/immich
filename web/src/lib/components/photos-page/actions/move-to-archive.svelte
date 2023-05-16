<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import { getAssetControlContext } from '../asset-select-control-bar.svelte';

	const { assets, clearSelect, removeAsset } = getAssetControlContext();

	const handleArchive = async () => {
		let cnt = 0;
		for (const asset of assets) {
			if (!asset.isArchived) {
				api.assetApi.updateAsset(asset.id, {
					isArchived: true
				});

				removeAsset?.(asset.id);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `Archived ${cnt}`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

<CircleIconButton title="Archive" logo={ArchiveArrowDownOutline} on:click={handleArchive} />
