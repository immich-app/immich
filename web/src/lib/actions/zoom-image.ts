import { photoZoomState } from '$lib/stores/zoom-image.store';
import { useZoomImageWheel } from '@zoom-image/svelte';
import { get } from 'svelte/store';

export const zoomImageAction = (node: HTMLElement) => {
  const { createZoomImage, zoomImageState, setZoomImageState } = useZoomImageWheel();

  createZoomImage(node, {
    maxZoom: 10,
  });

  const state = get(photoZoomState);
  if (state) {
    setZoomImageState(state);
  }

  const unsubscribes = [photoZoomState.subscribe(setZoomImageState), zoomImageState.subscribe(photoZoomState.set)];
  return {
    destroy() {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    },
  };
};
