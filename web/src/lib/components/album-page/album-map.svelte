<script lang="ts">
  import type { AssetManager } from '$lib/managers/asset-manager.svelte';
  import { modalManager } from '$lib/managers/modal-manager.svelte';
  import MapModal from '$lib/modals/MapModal.svelte';
  import { navigate } from '$lib/utils/navigation';
  import { getAlbumInfo, type AlbumResponseDto, type MapMarkerResponseDto } from '@immich/sdk';
  import { IconButton } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    assetManager: AssetManager;
    album: AlbumResponseDto;
  }

  let { assetManager = $bindable(), album }: Props = $props();
  let abortController: AbortController;

  let mapMarkers: MapMarkerResponseDto[] = $state([]);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
    assetManager.showAssetViewer = false;
  });

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    let albumInfo: AlbumResponseDto = await getAlbumInfo({ id: album.id, withoutAssets: false });

    let markers: MapMarkerResponseDto[] = [];
    for (const asset of albumInfo.assets) {
      if (asset.exifInfo?.latitude && asset.exifInfo?.longitude) {
        markers.push({
          id: asset.id,
          lat: asset.exifInfo.latitude,
          lon: asset.exifInfo.longitude,
          city: asset.exifInfo?.city ?? null,
          country: asset.exifInfo?.country ?? null,
          state: asset.exifInfo?.state ?? null,
        });
      }
    }

    return markers;
  }

  async function openMap() {
    const assetIds = await modalManager.show(MapModal, { mapMarkers });

    if (assetIds) {
      await navigate({ targetRoute: 'current', assetId: assetIds[0] });
    }
  }
</script>

<IconButton
  variant="ghost"
  shape="round"
  color="secondary"
  icon={mdiMapOutline}
  onclick={openMap}
  aria-label={$t('map')}
/>
