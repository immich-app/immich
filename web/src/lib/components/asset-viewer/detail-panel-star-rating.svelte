<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import StarRating from '$lib/components/shared-components/star-rating.svelte';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  const countStars = 5;

  $: rating = asset.exifInfo?.rating || 0;
  let currentRating = rating;

  const handleChangeRating = async (clickedId: CustomEvent<number>) => {
    currentRating = clickedId.detail;
    try {
      await updateAsset({
        id: asset.id,
        updateAssetDto: { rating: currentRating === asset.exifInfo?.rating ? 0 : currentRating },
      });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };
</script>

<section class="relative flex px-4">
  {#each { length: countStars } as _, id}
    <span>
      <StarRating {rating} {id} readOnly={!isOwner} on:click={handleChangeRating} />
    </span>
  {/each}
</section>
