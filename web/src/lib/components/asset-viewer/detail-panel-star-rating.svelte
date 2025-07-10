<script lang="ts">
  import { shortcuts } from '$lib/actions/shortcut';
  import StarRating from '$lib/components/shared-components/star-rating.svelte';
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

  let rating = $derived(asset.exifInfo?.rating || 0);

  const handleChangeRating = async (rating: number) => {
    try {
      await updateAsset({ id: asset.id, updateAssetDto: { rating } });
    } catch (error) {
      handleError(error, $t('errors.cant_apply_changes'));
    }
  };

  function handleShortcutRating(key: string) {
    if (!isOwner || authManager.key || !$preferences?.ratings.enabled) return;
    if (['1', '2', '3', '4', '5'].includes(key)) {
      handlePromiseError(handleChangeRating(Number(key)));
    }
    if (key === '0') {
      handlePromiseError(handleChangeRating(0));
    }
  }
</script>

<svelte:document
  use:shortcuts={[
    { shortcut: { key: '1' }, onShortcut: () => handleShortcutRating('1') },
    { shortcut: { key: '2' }, onShortcut: () => handleShortcutRating('2') },
    { shortcut: { key: '3' }, onShortcut: () => handleShortcutRating('3') },
    { shortcut: { key: '4' }, onShortcut: () => handleShortcutRating('4') },
    { shortcut: { key: '5' }, onShortcut: () => handleShortcutRating('5') },
    { shortcut: { key: '0' }, onShortcut: () => handleShortcutRating('0') },
  ]}
/>

{#if !authManager.key && $preferences?.ratings.enabled}
  <section class="px-4 pt-2">
    <StarRating {rating} readOnly={!isOwner} onRating={(rating) => handlePromiseError(handleChangeRating(rating))} />
  </section>
{/if}
