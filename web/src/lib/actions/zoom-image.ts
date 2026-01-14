import { photoZoomState } from '$lib/stores/zoom-image.store';
import { useZoomImageWheel } from '@zoom-image/svelte';
import { get } from 'svelte/store';

export const zoomImageAction = (node: HTMLElement, options?: { disabled?: boolean }) => {
  const { createZoomImage, zoomImageState, setZoomImageState } = useZoomImageWheel();

  createZoomImage(node, {
    maxZoom: 10,
  });

  const state = get(photoZoomState);
  if (state) {
    setZoomImageState(state);
  }

  // Store original event handlers so we can prevent them when disabled
  const wheelHandler = (event: WheelEvent) => {
    if (options?.disabled) {
      event.stopImmediatePropagation();
    }
  };

  const pointerDownHandler = (event: PointerEvent) => {
    if (options?.disabled) {
      event.stopImmediatePropagation();
    }
  };

  // Add handlers at capture phase with higher priority
  node.addEventListener('wheel', wheelHandler, { capture: true });
  node.addEventListener('pointerdown', pointerDownHandler, { capture: true });

  const unsubscribes = [photoZoomState.subscribe(setZoomImageState), zoomImageState.subscribe(photoZoomState.set)];

  return {
    update(newOptions?: { disabled?: boolean }) {
      options = newOptions;
    },
    destroy() {
      node.removeEventListener('wheel', wheelHandler, { capture: true });
      node.removeEventListener('pointerdown', pointerDownHandler, { capture: true });
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
    },
  };
};
