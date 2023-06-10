<script lang="ts">
	import CircleIconButton from '$lib/components/elements/buttons/circle-icon-button.svelte';
	import SelectAll from 'svelte-material-icons/SelectAll.svelte';
	import TimerSand from 'svelte-material-icons/TimerSand.svelte';
	import { assetInteractionStore } from '$lib/stores/asset-interaction.store';
	import { assetGridState, assetStore } from '$lib/stores/assets.store';
	import { handleError } from '../../../utils/handle-error';
	import { AssetGridState, BucketPosition } from '$lib/models/asset-grid-state';

	let selecting = false;

	const handleSelectAll = async () => {
		try {
			selecting = true;
			let _assetGridState = new AssetGridState();
			assetGridState.subscribe((state) => {
				_assetGridState = state;
			});

			for (let i = 0; i < _assetGridState.buckets.length; i++) {
				await assetStore.getAssetsByBucket(
					_assetGridState.buckets[i].bucketDate,
					BucketPosition.Unknown
				);
				for (const asset of _assetGridState.buckets[i].assets) {
					assetInteractionStore.addAssetToMultiselectGroup(asset);
				}
			}
			selecting = false;
		} catch (e) {
			handleError(e, 'Error selecting all assets');
		}
	};
</script>

{#if selecting}
	<CircleIconButton title="Delete" logo={TimerSand} />
{/if}
{#if !selecting}
	<CircleIconButton title="Select all" logo={SelectAll} on:click={handleSelectAll} />
{/if}
