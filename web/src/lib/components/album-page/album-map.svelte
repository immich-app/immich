<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import MapModal from '$lib/modals/MapModal.svelte';
  import { getAlbumInfo, type AlbumResponseDto, type MapMarkerResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();
  let abortController: AbortController;

  let mapMarkers: MapMarkerResponseDto[] = $state([]);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    abortController?.abort();
    assetViewerManager.showAssetViewer(false);
  });

  async function loadMapMarkers() {
    if (abortController) {
      abortController.abort();
    }
    abortController = new AbortController();

    let albumInfo: AlbumResponseDto = await getAlbumInfo({ id: album.id, withoutAssets: false, ...authManager.params });

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

  const onClick = async () => {
    const assetIds = await modalManager.show(MapModal, { mapMarkers });
    if (assetIds) {
      await assetViewerManager.setAssetId(assetIds[0]);
    }
  };
</script>

<IconButton
  variant="ghost"
  shape="round"
  color="secondary"
  icon={mdiMapOutline}
  onclick={onClick}
  aria-label={$t('map')}
/>
