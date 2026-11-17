<script lang="ts">
  import StarRating, { type Rating } from '#lib/elements/StarRating.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { eventManager } from '#lib/managers/event-manager.svelte.ts';
  import { handleError } from '#lib/utils/handle-error.ts';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { onDestroy } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let rating = $derived(asset.exifInfo?.rating ?? null) as Rating;

  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  let pendingAsset: AssetResponseDto | undefined;
  let pendingRating: Rating | undefined;

  const saveRating = async (targetAsset: AssetResponseDto, newRating: Rating) => {
    try {
      const response = await updateAsset({ id: targetAsset.id, updateAssetDto: { rating: newRating } });
      eventManager.emit('AssetUpdate', response);
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };

  const flushPendingRating = () => {
    if (timeoutId !== undefined && pendingAsset !== undefined && pendingRating !== undefined) {
      clearTimeout(timeoutId);
      const targetAsset = pendingAsset;
      const targetRating = pendingRating;
      timeoutId = undefined;
      pendingAsset = undefined;
      pendingRating = undefined;
      void saveRating(targetAsset, targetRating);
    }
  };

  const cancelPendingRating = () => {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
      timeoutId = undefined;
      pendingAsset = undefined;
      pendingRating = undefined;
    }
  };

  const handleRatingChange = (newRating: Rating) => {
    cancelPendingRating();

    if (newRating === rating) {
      return;
    }

    pendingAsset = asset;
    pendingRating = newRating;

    timeoutId = setTimeout(() => {
      flushPendingRating();
    }, 300);
  };

  let previousAssetId: string | undefined = $state();
  $effect(() => {
    if (previousAssetId && previousAssetId !== asset.id) {
      flushPendingRating();
    }
    previousAssetId = asset.id;
  });

  onDestroy(() => {
    cancelPendingRating();
  });
</script>

{#if !authManager.isSharedLink && authManager.authenticated && authManager.preferences.ratings.enabled}
  <section class="px-4 pt-4">
    {#key asset.id}
      <StarRating {rating} readOnly={!isOwner} onRating={handleRatingChange} />
    {/key}
  </section>
{/if}
