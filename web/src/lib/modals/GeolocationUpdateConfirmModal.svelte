<script lang="ts">
  import { ConfirmModal } from '@immich/ui';
  import { t } from 'svelte-i18n';

  interface Props {
    location: { latitude: number | undefined; longitude: number | undefined };
    assetCount: number;
    onClose: (confirm: boolean) => void;
  }

  let { location, assetCount, onClose }: Props = $props();
</script>

<ConfirmModal title={$t('confirm')} size="small" confirmColor="primary" {onClose}>
  {#snippet prompt()}
    <p>{$t('update_location_action_prompt', { values: { count: assetCount } })}</p>
    <p>- {$t('latitude')}: {location.latitude}</p>
    <p>- {$t('longitude')}: {location.longitude}</p>
  {/snippet}
</ConfirmModal>
