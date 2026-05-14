<script lang="ts">
  import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';

  type ZoomState = { currentZoom: number; currentPositionX: number; currentPositionY: number };

  type Props = {
    containerEl?: HTMLElement;
    canDrag?: () => boolean;
    getZoomState?: () => ZoomState;
    initialRect?: { centerX: number; centerY: number; width: number; height: number } | undefined;
    ctrlKeyHeld?: boolean;
  };

  let {
    containerEl,
    canDrag = () => true,
    getZoomState,
    initialRect = $bindable(undefined),
    ctrlKeyHeld = $bindable(false),
  }: Props = $props();

  let ctrlDrag = $state<{ start: { x: number; y: number }; current: { x: number; y: number } } | null>(null);

  // Clear initialRect whenever face edit mode closes so the + button still places the default box
  $effect(() => {
    if (!assetViewerManager.isFaceEditMode) {
      initialRect = undefined;
    }
  });

  $effect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Control' || e.key === 'Meta') {
        ctrlKeyHeld = e.type === 'keydown';
      }
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('keyup', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('keyup', onKey);
    };
  });

  $effect(() => {
    const el = containerEl;
    if (!el) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!event.ctrlKey && !event.metaKey) {
        return;
      }
      if (assetViewerManager.isFaceEditMode) {
        return;
      }
      if (!canDrag()) {
        return;
      }

      // Stop propagation so the zoom library never sees this pointer event and won't start a pan.
      event.stopPropagation();
      event.preventDefault();

      const containerRect = el.getBoundingClientRect();
      const startX = event.clientX - containerRect.left;
      const startY = event.clientY - containerRect.top;
      ctrlDrag = { start: { x: startX, y: startY }, current: { x: startX, y: startY } };

      const handlePointerMove = (e: PointerEvent) => {
        if (!e.ctrlKey && !e.metaKey) {
          cleanup();
          ctrlDrag = null;
          return;
        }
        if (ctrlDrag) {
          ctrlDrag.current = {
            x: Math.min(Math.max(e.clientX - containerRect.left, 0), containerRect.width),
            y: Math.min(Math.max(e.clientY - containerRect.top, 0), containerRect.height),
          };
        }
      };

      const handlePointerUp = () => {
        cleanup();
        const drag = ctrlDrag;
        ctrlDrag = null;
        if (!drag) {
          return;
        }
        const left = Math.min(drag.start.x, drag.current.x);
        const top = Math.min(drag.start.y, drag.current.y);
        const width = Math.abs(drag.current.x - drag.start.x);
        const height = Math.abs(drag.current.y - drag.start.y);
        if (width < 20 || height < 20) {
          return;
        }

        const zoomState = getZoomState?.();
        const zoom = zoomState?.currentZoom ?? 1;
        const panX = zoomState?.currentPositionX ?? 0;
        const panY = zoomState?.currentPositionY ?? 0;

        // eslint-disable-next-line no-useless-assignment
        initialRect = {
          centerX: (left - panX + width / 2) / zoom,
          centerY: (top - panY + height / 2) / zoom,
          width: width / zoom,
          height: height / zoom,
        };
        assetViewerManager.toggleFaceEditMode();
      };

      const cleanup = () => {
        document.removeEventListener('pointermove', handlePointerMove);
        document.removeEventListener('pointerup', handlePointerUp);
      };

      document.addEventListener('pointermove', handlePointerMove);
      document.addEventListener('pointerup', handlePointerUp);
    };

    el.addEventListener('pointerdown', handlePointerDown, { capture: true });
    return () => el.removeEventListener('pointerdown', handlePointerDown, { capture: true });
  });
</script>

{#if ctrlDrag}
  <div
    class="pointer-events-none absolute rounded-lg border-2 border-[rgb(66,80,175)] bg-[rgba(66,80,175,0.25)]"
    style="left: {Math.min(ctrlDrag.start.x, ctrlDrag.current.x)}px; top: {Math.min(
      ctrlDrag.start.y,
      ctrlDrag.current.y,
    )}px; width: {Math.abs(ctrlDrag.current.x - ctrlDrag.start.x)}px; height: {Math.abs(
      ctrlDrag.current.y - ctrlDrag.start.y,
    )}px;"
  ></div>
{/if}
