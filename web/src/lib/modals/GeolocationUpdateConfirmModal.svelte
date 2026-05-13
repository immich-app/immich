<script lang="ts">
  import type { LatLng } from '$lib/types';
  import { ConfirmModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    point: LatLng;
    assetCount: number;
    onClose: (confirm: boolean) => void;
  };

  let { point, assetCount, onClose }: Props = $props();
</script>

<ConfirmModal title={$t('confirm')} size="small" confirmColor="primary" {onClose}>
  {#snippet prompt()}
    <p>{$t('update_location_action_prompt', { values: { count: assetCount } })}</p>
    <p>- {$t('latitude')}: {point.lat}</p>
    <p>- {$t('longitude')}: {point.lng}</p>
  {/snippet}
</ConfirmModal>
