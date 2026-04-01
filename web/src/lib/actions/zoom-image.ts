import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { createZoomImageWheel } from '@zoom-image/core';

// Minimal touch shape — avoids importing DOM TouchEvent which isn't available in all TS targets.
type TouchEventLike = {
  touches: Iterable<{ clientX: number; clientY: number }> & { length: number };
  targetTouches: ArrayLike<unknown>;
};
const asTouchEvent = (event: Event) => event as unknown as TouchEventLike;

export const zoomImageAction = (node: HTMLElement, options?: { zoomTarget?: HTMLElement }) => {
  const zoomInstance = createZoomImageWheel(node, {
    maxZoom: 10,
    initialState: assetViewerManager.zoomState,
    zoomTarget: options?.zoomTarget,
  });

  const unsubscribes = [
    assetViewerManager.on({ ZoomChange: (state) => zoomInstance.setState(state) }),
    zoomInstance.subscribe(({ state }) => assetViewerManager.onZoomChange(state)),
  ];

  const controller = new AbortController();
  const { signal } = controller;

  node.addEventListener('pointerdown', () => assetViewerManager.cancelZoomAnimation(), { capture: true, signal });

  // Intercept events in capture phase to prevent zoom-image from seeing interactions on
  // overlay elements (e.g. OCR text boxes), preserving browser defaults like text selection.
  const isOverlayEvent = (event: Event) => !!(event.target as HTMLElement).closest('[data-overlay-interactive]');
  const isOverlayAtPoint = (x: number, y: number) =>
    !!document.elementFromPoint(x, y)?.closest('[data-overlay-interactive]');

  // Pointer event interception: track pointers that start on overlays and intercept the entire gesture.
  const overlayPointers = new Set<number>();
  const interceptedPointers = new Set<number>();
  const interceptOverlayPointerDown = (event: PointerEvent) => {
    if (isOverlayEvent(event) || isOverlayAtPoint(event.clientX, event.clientY)) {
      overlayPointers.add(event.pointerId);
      interceptedPointers.add(event.pointerId);
      event.stopPropagation();
    } else if (overlayPointers.size > 0) {
      // Split gesture (e.g. pinch with one finger on overlay) — intercept entirely.
      interceptedPointers.add(event.pointerId);
      event.stopPropagation();
    }
  };
  const interceptOverlayPointerEvent = (event: PointerEvent) => {
    if (interceptedPointers.has(event.pointerId)) {
      event.stopPropagation();
    }
  };
  const interceptOverlayPointerEnd = (event: PointerEvent) => {
    overlayPointers.delete(event.pointerId);
    if (interceptedPointers.delete(event.pointerId)) {
      event.stopPropagation();
    }
  };
  node.addEventListener('pointerdown', interceptOverlayPointerDown, { capture: true, signal });
  node.addEventListener('pointermove', interceptOverlayPointerEvent, { capture: true, signal });
  node.addEventListener('pointerup', interceptOverlayPointerEnd, { capture: true, signal });
  node.addEventListener('pointerleave', interceptOverlayPointerEnd, { capture: true, signal });

  // Touch event interception for overlay touches or split gestures (pinch across container boundary).
  // Once intercepted, stays intercepted until all fingers are lifted.
  let touchGestureIntercepted = false;
  const interceptOverlayTouchEvent = (event: Event) => {
    if (touchGestureIntercepted) {
      event.stopPropagation();
      return;
    }
    const { touches, targetTouches } = asTouchEvent(event);
    if (touches && targetTouches) {
      if (touches.length > targetTouches.length) {
        touchGestureIntercepted = true;
        event.stopPropagation();
        return;
      }
      for (const touch of touches) {
        if (isOverlayAtPoint(touch.clientX, touch.clientY)) {
          touchGestureIntercepted = true;
          event.stopPropagation();
          return;
        }
      }
    } else if (isOverlayEvent(event)) {
      event.stopPropagation();
    }
  };
  const resetTouchGesture = (event: Event) => {
    const { touches } = asTouchEvent(event);
    if (touches.length === 0) {
      touchGestureIntercepted = false;
    }
  };
  node.addEventListener('touchstart', interceptOverlayTouchEvent, { capture: true, signal });
  node.addEventListener('touchmove', interceptOverlayTouchEvent, { capture: true, signal });
  node.addEventListener('touchend', resetTouchGesture, { capture: true, signal });

  // Wheel and dblclick interception on overlay elements.
  // Dblclick also intercepted for all touch double-taps (Safari fires synthetic dblclick
  // on double-tap, which conflicts with zoom-image's touch zoom handler).
  let lastPointerWasTouch = false;
  node.addEventListener('pointerdown', (event) => (lastPointerWasTouch = event.pointerType === 'touch'), {
    capture: true,
    signal,
  });
  node.addEventListener(
    'wheel',
    (event) => {
      if (isOverlayEvent(event)) {
        event.stopPropagation();
      }
    },
    { capture: true, signal },
  );
  node.addEventListener(
    'dblclick',
    (event) => {
      if (lastPointerWasTouch || isOverlayEvent(event)) {
        event.stopImmediatePropagation();
      }
    },
    { capture: true, signal },
  );

  if (options?.zoomTarget) {
    options.zoomTarget.style.willChange = 'transform';
  }
  node.style.overflow = 'visible';
  node.style.touchAction = 'none';
  return {
    update(newOptions?: { zoomTarget?: HTMLElement }) {
      options = newOptions;
      if (newOptions?.zoomTarget !== undefined) {
        zoomInstance.setState({ zoomTarget: newOptions.zoomTarget });
      }
    },
    destroy() {
      controller.abort();
      if (options?.zoomTarget) {
        options.zoomTarget.style.willChange = '';
      }
      for (const unsubscribe of unsubscribes) {
        unsubscribe();
      }
      zoomInstance.cleanup();
    },
  };
};
