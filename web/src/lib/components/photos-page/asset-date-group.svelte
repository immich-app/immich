<script lang="ts">
	import { assetStore } from '$lib/stores/assets.store';

	import { AssetResponseDto } from '@api';
	import lodash from 'lodash-es';
	import moment from 'moment';
	import ImmichThumbnail from '../shared-components/immich-thumbnail.svelte';

	export let assets: AssetResponseDto[];
	export let bucketDate: string;

	let isMouseOverGroup = false;
	let actualBucketHeight: number;

	$: assetsGroupByDate = lodash
		.chain(assets)
		.groupBy((a) => moment(a.createdAt).format('ddd, MMM DD YYYY'))
		.sortBy((group) => assets.indexOf(group[0]))
		.value();

	$: {
		// Update bucket height
		if (actualBucketHeight != 0) {
			assetStore.updateBucketHeight(bucketDate, actualBucketHeight);
		}
	}
</script>

<section
	id="asset-group-by-date"
	class="flex flex-wrap gap-14"
	bind:clientHeight={actualBucketHeight}
>
	{#each assetsGroupByDate as assetsInDateGroup, groupIndex}
		<!-- Asset Group By Date -->
		<div
			class="flex flex-col"
			on:mouseenter={() => (isMouseOverGroup = true)}
			on:mouseleave={() => (isMouseOverGroup = false)}
		>
			<!-- Date group title -->
			<p class="font-medium text-sm text-immich-fg mb-2 flex place-items-center h-6">
				<!-- {#if (selectedGroupThumbnail === groupIndex && isMouseOverGroup) || selectedGroup.has(groupIndex)}
								<div
									in:fly={{ x: -24, duration: 200, opacity: 0.5 }}
									out:fly={{ x: -24, duration: 200 }}
									class="inline-block px-2 hover:cursor-pointer"
									on:click={() => selectAssetGroupHandler(groupIndex)}
								>
									{#if selectedGroup.has(groupIndex)}
										<CheckCircle size="24" color="#4250af" />
									{:else if existingGroup.has(groupIndex)}
										<CheckCircle size="24" color="#757575" />
									{:else}
										<CircleOutline size="24" color="#757575" />
									{/if}
								</div>
							{/if} -->

				{moment(assetsInDateGroup[0].createdAt).format('ddd, MMM DD YYYY')}
			</p>

			<!-- Image grid -->
			<div class="flex flex-wrap gap-[2px]">
				{#each assetsInDateGroup as asset}
					{#key asset.id}
						<ImmichThumbnail {asset} {groupIndex} />
					{/key}
				{/each}
			</div>
		</div>
	{/each}
</section>
