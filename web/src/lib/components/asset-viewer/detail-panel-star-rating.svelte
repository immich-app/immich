<script lang="ts">
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';
  import StarRating from '$lib/components/shared-components/star-rating.svelte';
  import { handlePromiseError, isSharedLink } from '$lib/utils';
  import { preferences } from '$lib/stores/user.store';

  export let asset: AssetResponseDto;
  export let isOwner: boolean;

  $: rating = asset.exifInfo?.rating || 0;

  const handleChangeRating = async (rating: number) => {
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { rating } });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };
</script>

{#if !isSharedLink() && $preferences?.ratings.enabled}
  <section class="px-4 pt-2">
    <StarRating {rating} readOnly={!isOwner} onRating={(rating) => handlePromiseError(handleChangeRating(rating))} />
  </section>
{/if}
