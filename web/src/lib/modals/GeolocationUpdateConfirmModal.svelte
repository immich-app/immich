<script lang="ts">
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import type { LatLng } from '$lib/types';
  import { ConfirmModal, Icon } from '@immich/ui';
  import { mdiAlertCircle } from '@mdi/js';
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
      <div class="mb-4 flex items-start gap-3 rounded-lg border border-warning bg-warning/20 p-4">
        <Icon icon={mdiAlertCircle} size="24px" class="mt-1 shrink-0 text-warning" />
        <p class="font-semibold text-warning">{$t('some_assets_already_have_a_location_warning')}</p>
      </div>
    {/if}
    <p>{$t('update_location_action_prompt', { values: { count: assetCount } })}</p>
    <p>- {$t('latitude')}: {point.lat}</p>
    <p>- {$t('longitude')}: {point.lng}</p>
  {/snippet}
</ConfirmModal>
