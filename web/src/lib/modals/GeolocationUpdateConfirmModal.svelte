<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { LatLng } from '$lib/types';
  import { Alert, ConfirmModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    point: LatLng;
    assetCount: number;
    onClose: (confirm: boolean) => void;
  };

  const { point, assetCount, onClose }: Props = $props();

  const hasExistingLocations = $derived(
    assetMultiSelectManager.assets.some((asset) => asset.latitude != null || asset.longitude != null),
  );
</script>

<ConfirmModal title={$t('confirm')} size="small" confirmColor="primary" {onClose}>
  {#snippet prompt()}
    {#if hasExistingLocations}
      <Alert color="warning" class="mb-4">{$t('some_assets_already_have_a_location_warning')}</Alert>
    {/if}
    <p>{$t('update_location_action_prompt', { values: { count: assetCount } })}</p>
    <p>- {$t('latitude')}: {point.lat}</p>
    <p>- {$t('longitude')}: {point.lng}</p>
  {/snippet}
</ConfirmModal>
