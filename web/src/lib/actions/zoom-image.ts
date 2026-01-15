import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { createZoomImageWheel } from '@zoom-image/core';

export const zoomImageAction = (node: HTMLElement, options?: { disabled?: boolean; zoomTarget?: HTMLElement }) => {
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    initialState: assetViewerManager.zoomState,
    zoomTarget: options?.zoomTarget ?? null,
  });

  const unsubscribes = [
    assetViewerManager.on({ ZoomChange: (state) => zoomInstance.setState(state) }),
    zoomInstance.subscribe(({ state }) => assetViewerManager.onZoomChange(state)),
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
    update(newOptions?: { disabled?: boolean; zoomTarget?: HTMLElement }) {
      options = newOptions;
      zoomInstance.setState({ zoomTarget: newOptions?.zoomTarget ?? null });
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
