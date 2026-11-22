<script lang="ts">
  import StarRating, { type Rating } from '#lib/elements/StarRating.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { handlePromiseError } from '#lib/utils.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let rating = $derived(asset.exifInfo?.rating ?? null) as Rating;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  const saveRating = async (assetId: string, ratingOnClick: Rating, savedRating: Rating) => {
    try {
      if (ratingOnClick === savedRating) {
        return;
      }

      await updateAsset({ id: assetId, updateAssetDto: { rating: ratingOnClick } });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };

  const handleChangeRating = (assetId: string, ratingOnClick: Rating, savedRating: Rating) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => handlePromiseError(saveRating(assetId, ratingOnClick, savedRating)), 300);
  };
</script>

{#if !authManager.isSharedLink && authManager.authenticated && authManager.preferences.ratings.enabled}
  <section class="px-4 pt-4">
    {#key asset.id}
      <StarRating
        {rating}
        readOnly={!isOwner}
        onRating={(ratingOnClick) => handleChangeRating(asset.id, ratingOnClick, rating)}
      />
    {/key}
  </section>
{/if}
