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
	export let isAll: boolean;

	const { getAssets, clearSelect } = getAssetControlContext();

	const handleArchive = async (isArchived: boolean) => {
		let cnt = 0;

		for (const asset of getAssets()) {
			if (asset.isArchived !== isArchived) {
				api.assetApi.updateAsset(asset.id, { isArchived });

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
	{#if isAll}
		<MenuOption text="Unarchive" on:click={() => handleArchive(false)} />
	{:else}
		<MenuOption text="Archive" on:click={() => handleArchive(true)} />
	{/if}
{:else if isAll}
	<CircleIconButton
		title="Archive"
		logo={ArchiveArrowDownOutline}
		on:click={() => handleArchive(true)}
	/>
{:else}
	<CircleIconButton
		title="Unarchive"
		logo={ArchiveArrowUpOutline}
		on:click={() => handleArchive(true)}
	/>
{/if}
