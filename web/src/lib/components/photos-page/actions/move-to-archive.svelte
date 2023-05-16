<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import { OnAssetArchive, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetArchive: OnAssetArchive = (asset, archive) => {
		asset.isArchived = archive;
	};

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleArchive = async () => {
		let cnt = 0;

		for (const asset of getAssets()) {
			if (!asset.isArchived) {
				api.assetApi.updateAsset(asset.id, {
					isArchived: true
				});

				onAssetArchive(asset, true);
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
