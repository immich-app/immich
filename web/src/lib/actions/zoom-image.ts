import { photoZoomState } from '$lib/stores/zoom-image.store';
import { createZoomImageWheel } from '@zoom-image/core';
import { get } from 'svelte/store';

export const zoomImageAction = (node: HTMLElement, options?: { disabled?: boolean }) => {
  const state = get(photoZoomState);
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    initialState: state,
  });

  const unsubscribes = [
    photoZoomState.subscribe((state) => zoomInstance.setState(state)),
    zoomInstance.subscribe(({ state }) => {
      photoZoomState.set(state);
    }),
  ];

  const stopIfDisabled = (event: Event) => {
    if (options?.disabled) {
      event.stopImmediatePropagation();
    }
  };

  node.addEventListener('wheel', stopIfDisabled, { capture: true });
  node.addEventListener('pointerdown', stopIfDisabled, { capture: true });

  node.style.overflow = 'visible';
  return {
    update(newOptions?: { disabled?: boolean }) {
      options = newOptions;
    },
    destroy() {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      node.removeEventListener('wheel', stopIfDisabled, { capture: true });
      node.removeEventListener('pointerdown', stopIfDisabled, { capture: true });
      zoomInstance.cleanup();
    },
  };
};
