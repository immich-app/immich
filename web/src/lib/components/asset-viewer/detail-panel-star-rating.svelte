<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import Star from '$lib/components/shared-components/settings/star-rating.svelte';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  const countStars = 6;

  $: rating = asset.exifInfo?.rating || 0;
  let currentRating = rating;

  const handleChangeRating = async (clickedId: CustomEvent<number>) => {
    currentRating = clickedId.detail;
    if (currentRating === asset.exifInfo?.rating) {
      return;
    }
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { rating: currentRating } });
    } catch (error) {
      handleError(error, $t('cant_apply_changes'));
    }
    rating = currentRating;
  };
</script>

<section class="relative flex px-4">
  {#each { length: countStars } as _, id}
    <span>
      <Star {rating} {id} readOnly={!isOwner} on:click={handleChangeRating} />
    </span>
  {/each}
</section>
