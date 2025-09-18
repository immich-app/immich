<script lang="ts">
  import { Button, HStack, Modal, ModalBody, ModalFooter } from '@immich/ui';
  import { mdiAlertCircle } from '@mdi/js';
  import { t } from 'svelte-i18n';

  interface Props {
    location: { latitude: number | undefined; longitude: number | undefined };
    assetCount: number;
    onClose: (confirm?: true) => void;
    locationName: string | null;
    hasCityOrCountry: boolean;
    hasExistingLocations: boolean;
  }

  let { location, assetCount, onClose, locationName, hasCityOrCountry, hasExistingLocations }: Props = $props();
</script>

<Modal title={$t('confirm')} size="small" {onClose}>
  <ModalBody>
    {#if hasExistingLocations}
      <div class="flex items-start gap-3 p-4 rounded-lg bg-warning/20 border border-warning">
        <svg class="text-warning shrink-0 mt-1" style="width:24px;height:24px" viewBox="0 0 24 24">
          <path fill="currentColor" d={mdiAlertCircle} />
        </svg>
        <div class="text-warning font-semibold">
          {$t('some_assets_already_have_a_location_warning')}
        </div>
      </div>
      <br />
    {/if}
    <p>
      {$t('update_location_action_prompt', {
        values: {
          count: assetCount,
        },
      })}
    </p>
    {#if location}
      <ul class="list-disc ml-8">
        {#if hasCityOrCountry}
          <li>{locationName} ({location.latitude.toFixed(3)}, {location.longitude.toFixed(3)})</li>
        {:else}
          <li>{$t('latitude')}: {location.latitude.toFixed(3)}</li>
          <li>{$t('longitude')}: {location.longitude.toFixed(3)}</li>
        {/if}
      </ul>
    {/if}
  </ModalBody>
  <ModalFooter>
    <HStack fullWidth>
      <Button shape="round" color="secondary" fullWidth onclick={() => onClose()}>{$t('cancel')}</Button>
      <Button shape="round" type="submit" fullWidth onclick={() => onClose(true)}>{$t('confirm')}</Button>
    </HStack>
  </ModalFooter>
</Modal>
