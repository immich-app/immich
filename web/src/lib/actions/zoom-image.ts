import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { createZoomImageWheel } from '@zoom-image/core';

export const zoomImageAction = (node: HTMLElement, options?: { disabled?: boolean }) => {
  const zoomInstance = createZoomImageWheel(node, { maxZoom: 10, initialState: assetViewerManager.zoomState });

  const unsubscribes = [
    assetViewerManager.on({ ZoomChange: (state) => zoomInstance.setState(state) }),
    zoomInstance.subscribe(({ state }) => assetViewerManager.onZoomChange(state)),
  ];

  const onInteractionStart = (event: Event) => {
    if (options?.disabled) {
      event.stopImmediatePropagation();
    }
    assetViewerManager.cancelZoomAnimation();
  };

  node.addEventListener('wheel', onInteractionStart, { capture: true });
  node.addEventListener('pointerdown', onInteractionStart, { capture: true });

  node.style.overflow = 'visible';
  return {
    update(newOptions?: { disabled?: boolean }) {
      options = newOptions;
    },
    destroy() {
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      node.removeEventListener('wheel', onInteractionStart, { capture: true });
      node.removeEventListener('pointerdown', onInteractionStart, { capture: true });
      zoomInstance.cleanup();
    },
  };
};
