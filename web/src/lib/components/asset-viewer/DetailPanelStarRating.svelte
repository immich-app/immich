<script lang="ts">
  import StarRating, { type Rating } from '#lib/elements/StarRating.svelte';
  import { authManager } from '#lib/managers/auth-manager.svelte.ts';
  import { updateAssetMutation } from '#lib/queries/asset.query.ts';
  import { executeMutation } from '#lib/queries/client.ts';
  import type { AssetResponseDto } from '@immich/sdk';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let rating = $derived(asset.exifInfo?.rating ?? null) as Rating;

  const handleChangeRating = (rating: Rating) =>
    executeMutation(
      () => updateAssetMutation({ error: { toast: 'errors.cant_apply_changes' } }),
      [{ id: asset.id, updateAssetDto: { rating } }],
    );
</script>

{#if !authManager.isSharedLink && authManager.authenticated && authManager.preferences.ratings.enabled}
  <section class="px-4 pt-4">
    <StarRating {rating} readOnly={!isOwner} onRating={(rating) => void handleChangeRating(rating)} />
  </section>
{/if}
