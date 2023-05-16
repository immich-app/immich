<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import ArchiveArrowUpOutline from 'svelte-material-icons/ArchiveArrowUpOutline.svelte';
	import { OnAssetArchive, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetArchive: OnAssetArchive = (asset, archived) => {
		asset.isArchived = archived;
	};

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleUnarchive = async () => {
		let cnt = 0;
		for (const asset of getAssets()) {
			if (asset.isArchived) {
				api.assetApi.updateAsset(asset.id, {
					isArchived: false
				});

				onAssetArchive(asset, false);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `Removed ${cnt} from archive`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

<CircleIconButton title="Unarchive" logo={ArchiveArrowUpOutline} on:click={handleUnarchive} />
