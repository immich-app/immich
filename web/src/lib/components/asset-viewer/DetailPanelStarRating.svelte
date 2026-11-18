<script lang="ts">
  import StarRating, { type Rating } from '#lib/elements/StarRating.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { handlePromiseError } from '#lib/utils.ts';
  import { eventManager } from '#lib/managers/event-manager.svelte.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let rating = $derived(asset.exifInfo?.rating ?? null) as Rating;

  const handleChangeRating = async (rating: Rating, assetId: string) => {
    try {
      const response = await updateAsset({ id: assetId, updateAssetDto: { rating } });
      eventManager.emit('AssetUpdate', response);
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };
</script>

{#if !authManager.isSharedLink && authManager.authenticated && authManager.preferences.ratings.enabled}
  <section class="px-4 pt-4">
    {#key asset.id}
      <StarRating
        {rating}
        readOnly={!isOwner}
        onRating={((assetId) => (rating: Rating) => handlePromiseError(handleChangeRating(rating, assetId)))(
          asset.id,
        )}
      />
    {/key}
  </section>
{/if}
