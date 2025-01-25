import { photoZoomState, rotated, zoomed } from '$lib/stores/zoom-image.store';
import { useZoomImageWheel } from '@zoom-image/svelte';
import { get } from 'svelte/store';

export { rotated, zoomed } from '$lib/stores/zoom-image.store';

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
    rotated.subscribe((state) => setZoomImageState({ currentRotation: state * 90 })),
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
