<script lang="ts">
  import StarRating, { type Rating } from '$lib/elements/StarRating.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import { preferences } from '$lib/stores/user.store';
  import { handlePromiseError } from '$lib/utils';
  import { handleError } from '$lib/utils/handle-error';
  import { updateAsset, type AssetResponseDto } from '@immich/sdk';
  import { t } from 'svelte-i18n';

  interface Props {
    asset: AssetResponseDto;
    isOwner: boolean;
  }

  let { asset, isOwner }: Props = $props();

  let rating = $derived(asset.exifInfo?.rating || null) as Rating;

  const handleChangeRating = async (rating: number | null) => {
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { rating } });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };
</script>

{#if !authManager.isSharedLink && $preferences?.ratings.enabled}
  <section class="px-4 pt-4">
    <StarRating {rating} readOnly={!isOwner} onRating={(rating) => handlePromiseError(handleChangeRating(rating))} />
  </section>
{/if}
