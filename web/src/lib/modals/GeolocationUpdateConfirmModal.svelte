<script lang="ts">
  import { ConfirmModal } from '@immich/ui';
  import { mdiAlertCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    location: { latitude: number | undefined; longitude: number | undefined };
    assetCount: number;
    locationName?: string | null;
    hasCityOrCountry?: boolean;
    hasExistingLocations?: boolean;
    onClose: (confirm: boolean) => void;
  }

  let {
    location,
    assetCount,
    locationName = null,
    hasCityOrCountry = false,
    hasExistingLocations = false,
    onClose,
  }: Props = $props();
</script>

<ConfirmModal title={$t('confirm')} size="small" confirmColor="primary" {onClose}>
  {#snippet prompt()}
    {#if hasExistingLocations}
      <div class="flex items-start gap-3 p-4 mb-4 rounded-lg bg-warning/20 border border-warning">
        <svg class="text-warning shrink-0 mt-1" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiAlertCircle} />
        </svg>
        <div class="text-warning font-semibold">
          {$t('some_assets_already_have_a_location_warning')}
        </div>
      </div>
    {/if}

    <p class="mb-2">{$t('update_location_action_prompt', { values: { count: assetCount } })}</p>

    <ul class="list-disc ml-8">
      {#if hasCityOrCountry && locationName}
        <li>{locationName} ({location.latitude?.toFixed(3)}, {location.longitude?.toFixed(5)})</li>
      {:else}
        <li>{$t('latitude')}: {location.latitude?.toFixed(3)}</li>
        <li>{$t('longitude')}: {location.longitude?.toFixed(3)}</li>
      {/if}
    </ul>
  {/snippet}
</ConfirmModal>
