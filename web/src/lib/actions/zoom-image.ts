import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { createZoomImageWheel } from '@zoom-image/core';

export const zoomImageAction = (node: HTMLElement, options?: { disabled?: boolean }) => {
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    initialState: assetViewerManager.zoomState,
    zoomTarget: null,
  });

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

  // Suppress Safari's synthetic dblclick on double-tap. Without this, zoom-image's touchstart
  // handler zooms to maxZoom (10x), then Safari's synthetic dblclick triggers photo-viewer's
  // handler which conflicts. Chrome does not fire synthetic dblclick on touch.
  let lastPointerWasTouch = false;
  const trackPointerType = (event: PointerEvent) => {
    lastPointerWasTouch = event.pointerType === 'touch';
  };
  const suppressTouchDblClick = (event: MouseEvent) => {
    if (lastPointerWasTouch) {
      event.stopImmediatePropagation();
    }
  };
  node.addEventListener('pointerdown', trackPointerType, { capture: true });
  node.addEventListener('dblclick', suppressTouchDblClick, { capture: true });

  // Allow zoomed content to render outside the container bounds
  node.style.overflow = 'visible';
  // Prevent browser handling of touch gestures so zoom-image can manage them
  node.style.touchAction = 'none';
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
      node.removeEventListener('pointerdown', trackPointerType, { capture: true });
      node.removeEventListener('dblclick', suppressTouchDblClick, { capture: true });
      zoomInstance.cleanup();
    },
  };
};
