<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/stores';
  import UploadCover from '$lib/components/shared-components/drag-and-drop-upload-overlay.svelte';
  import { AppRoute } from '$lib/constants';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { assetEvents } from '$lib/utils/custom-events';
  let { isViewing: showAssetViewer, setAsset } = assetViewingStore;

  function currentUrlWithoutAsset() {
    // This contains special casing for the /photos/:assetId route, which hangs directly
    // off / instead of a subpath, unlike every other asset-containing route.
    return $page.route.id === '/(user)/photos/[[assetId=id]]'
      ? AppRoute.PHOTOS + $page.url.search
      : $page.url.pathname.replace(/(\/photos.*)$/, '') + $page.url.search;
  }

  function currentUrlReplaceAssetId(assetId: string) {
    // this contains special casing for the /photos/:assetId photos route, which hangs directly
    // off / instead of a subpath, unlike every other asset-containing route.
    return $page.route.id === '/(user)/photos/[[assetId=id]]'
      ? `${AppRoute.PHOTOS}/${assetId}${$page.url.search}`
      : `${$page.url.pathname.replace(/(\/photos.*)$/, '')}/photos/${assetId}${$page.url.search}`;
  }

  // This block takes care of opening the viewer.
  // $page.data.asset is loaded by route specific +page.ts loaders if that
  // route contains the assetId path.
  $: {
    if ($page.data.asset) {
      setAsset($page.data.asset);
    } else {
      $showAssetViewer = false;
    }
  }
</script>

<main
  use:assetEvents
  on:asset-opened={({ detail: { assetId } }) => {
    // when asset is opened, navigate to new route (_with_ assetId)
    void goto(currentUrlReplaceAssetId(assetId), { replaceState: false, state: { assetId } });
  }}
  on:asset-closed={() => {
    // when asset is closed, navigate to base route (_without_ assetId)
    void goto(currentUrlWithoutAsset(), { replaceState: false, state: { assetId: undefined } });
  }}
  on:asset-changed={({ detail: { toAssetId } }) => {
    // when asset is changed, navigate to new route (_with_ assetId)
    void goto(currentUrlReplaceAssetId(toAssetId), { replaceState: false, state: { assetId: toAssetId } });
  }}
>
  <slot />
</main>

<UploadCover />
