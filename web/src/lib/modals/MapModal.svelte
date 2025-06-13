<script lang="ts">
  import { timeToLoadTheMap } from '$lib/constants';
  import { delay } from '$lib/utils/asset-utils';
  import type { MapMarkerResponseDto } from '@immich/sdk';
  import { LoadingSpinner, Modal, ModalBody } from '@immich/ui';
  import { t } from 'svelte-i18n';

  type Props = {
    onClose: (assetIds?: string[]) => void;
    mapMarkers: MapMarkerResponseDto[];
    zoom?: number;
  };

  let { onClose, mapMarkers, zoom }: Props = $props();
</script>

<Modal title={$t('map')} size="giant" {onClose}>
  <ModalBody>
    <div class="flex flex-col w-full h-full gap-2 border border-gray-300 dark:border-light rounded-2xl">
      <div class="h-[75vh] min-h-[300px] w-full">
        {#await import('../components/shared-components/map/map.svelte')}
          {#await delay(timeToLoadTheMap) then}
            <!-- show the loading spinner only if loading the map takes too much time -->
            <div class="flex items-center justify-center h-full w-full">
              <LoadingSpinner />
            </div>
          {/await}
        {:then { default: Map }}
          <Map
            center={undefined}
            {zoom}
            clickable={false}
            {mapMarkers}
            onSelect={onClose}
            showSettings={false}
            rounded
          />
        {/await}
      </div>
    </div>
  </ModalBody>
</Modal>
