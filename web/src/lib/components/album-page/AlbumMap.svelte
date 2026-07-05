<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import MapModal from '$lib/modals/MapModal.svelte';
  import { handleError } from '$lib/utils/handle-error';
  import { navigate } from '$lib/utils/navigation';
  import { getAlbumMapMarkers, type AlbumResponseDto, type MapMarkerResponseDto } from '@immich/sdk';
  import { IconButton, modalManager } from '@immich/ui';
  import { mdiMapOutline } from '@mdi/js';
  import { onDestroy, onMount } from 'svelte';
  import { t } from 'svelte-i18n';

  interface Props {
    album: AlbumResponseDto;
  }

  let { album }: Props = $props();
  let cancelable: AbortController;

  let returnToMap = $state(false);
  let mapMarkers: MapMarkerResponseDto[] = $state([]);

  onMount(async () => {
    mapMarkers = await loadMapMarkers();
  });

  onDestroy(() => {
    cancelable?.abort();
    assetViewerManager.showAssetViewer(false);
  });

  $effect(() => {
    if (!assetViewerManager.isViewing && returnToMap) {
      returnToMap = false;
      void onClick();
    }
  });

  const loadMapMarkers = async () => {
    cancelable?.abort();
    cancelable = new AbortController();

    try {
      return await getAlbumMapMarkers({ ...authManager.params, id: album.id }, { signal: cancelable.signal });
    } catch (error) {
      handleError(error, $t('errors.something_went_wrong'));
      return [];
    }
  };

  const onClick = async () => {
    const assetIds = await modalManager.show(MapModal, { mapMarkers });
    if (assetIds) {
      await navigate({ targetRoute: 'current', assetId: assetIds[0] });
      returnToMap = true;
    } else {
      returnToMap = false;
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
