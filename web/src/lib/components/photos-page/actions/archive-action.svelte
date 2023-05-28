<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import {
		NotificationType,
		notificationController
	} from '$lib/components/shared-components/notification/notification';
	import { api } from '@api';
	import ArchiveArrowDownOutline from 'svelte-material-icons/ArchiveArrowDownOutline.svelte';
	import ArchiveArrowUpOutline from 'svelte-material-icons/ArchiveArrowUpOutline.svelte';
	import MenuOption from '../../shared-components/context-menu/menu-option.svelte';
	import { OnAssetArchive, getAssetControlContext } from '../asset-select-control-bar.svelte';

	export let onAssetArchive: OnAssetArchive = (asset, isArchived) => {
		asset.isArchived = isArchived;
	};

	export let menuItem = false;
	export let unarchive = false;

	$: text = unarchive ? 'Unarchive' : 'Archive';
	$: logo = unarchive ? ArchiveArrowUpOutline : ArchiveArrowDownOutline;

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleArchive = async () => {
		const isArchived = !unarchive;
		let cnt = 0;

		for (const asset of getAssets()) {
			if (asset.isArchived !== isArchived) {
				api.assetApi.updateAsset({ assetId: asset.id, updateAssetDto: { isArchived } });

				onAssetArchive(asset, isArchived);
				cnt = cnt + 1;
			}
		}

		notificationController.show({
			message: `${isArchived ? 'Archived' : 'Unarchived'} ${cnt}`,
			type: NotificationType.Info
		});

		clearSelect();
	};
</script>

{#if menuItem}
	<MenuOption {text} on:click={handleArchive} />
{:else}
	<CircleIconButton title={text} {logo} on:click={handleArchive} />
{/if}
