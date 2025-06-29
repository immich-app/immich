import type { AssetManager } from '$lib/managers/asset-manager/asset-manager.svelte';
import { useZoomImageWheel } from '@zoom-image/svelte';
import type { Attachment } from 'svelte/attachments';

export function zoomImageAttachment(assetManager: AssetManager): Attachment<HTMLElement> {
  return (element) => {
    let zoomImage = $derived(assetManager.zoomImageState);
    const { createZoomImage, zoomImageState, setZoomImageState } = useZoomImageWheel();

    createZoomImage(element, { maxZoom: 10 });

    $effect(() => {
      if (zoomImage) {
        setZoomImageState(zoomImage);
      }
    });

    const unsubscribe = zoomImageState.subscribe((value) => (zoomImage = value));

    return () => {
      unsubscribe();
    };
  };
}
