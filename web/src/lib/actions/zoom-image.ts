import { photoZoomState, zoomed } from '$lib/stores/zoom-image.store';
import { useZoomImageWheel } from '@zoom-image/svelte';
import { get } from 'svelte/store';

export { zoomed } from '$lib/stores/zoom-image.store';

export const zoomImageAction = (node: HTMLElement) => {
  const { createZoomImage, zoomImageState, setZoomImageState } = useZoomImageWheel();

  createZoomImage(node, {
    maxZoom: 10,
    wheelZoomRatio: 0.2,
  });

  const state = get(photoZoomState);
  if (state) {
    setZoomImageState(state);
  }

  const unsubscribes = [
    zoomed.subscribe((state) => setZoomImageState({ currentZoom: state ? 2 : 1 })),
    zoomImageState.subscribe((state) => photoZoomState.set(state)),
  ];
  return {
    destroy() {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    },
  };
};
