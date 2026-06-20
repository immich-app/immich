<script lang="ts">
  import { flip } from 'svelte/animate';
  import Thumbnail from '$lib/components/assets/thumbnail/Thumbnail.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetMultiSelectManager } from '$lib/managers/asset-multi-select-manager.svelte';
  import { handleMoveAlbumAsset } from '$lib/services/album.service';
  import { mdiDragVertical } from '@mdi/js';
  import { Icon } from '@immich/ui';
  import type { AlbumResponseDto } from '@immich/sdk';

  interface Props {
    album: AlbumResponseDto;
    assets: TimelineAsset[];
    interactionMode: 'reorder' | 'select';
    onClickAsset?: (asset: TimelineAsset) => void;
    onReorder?: (assets: TimelineAsset[]) => void;
  }

  let { album, assets, interactionMode, onClickAsset, onReorder }: Props = $props();

  let displayAssets = $state<TimelineAsset[]>([]);
  let isDragging = $state(false);
  let previousOrder: TimelineAsset[] | null = $state<TimelineAsset[] | null>(null);

  // Drag feedback: floating thumbnail that follows the cursor
  let dragCursorX = $state(0);
  let dragCursorY = $state(0);

  // Drop target highlight: the tile under the cursor during drag
  let dragTargetId = $state<string | undefined>(undefined);

  const dragState = {
    pointerId: undefined as number | undefined,
    sourceId: undefined as string | undefined,
    startX: 0,
    startY: 0,
    exceededThreshold: false,
    rafPending: false,
  };

  let dragSourceAsset = $derived(
    isDragging && dragState.sourceId ? displayAssets.find((a) => a.id === dragState.sourceId) : undefined,
  );

  const DRAG_THRESHOLD = 5;

  const HYSTERESIS_PX = 20;

  // Sync displayAssets from assets prop.
  // When not dragging: sync both ID changes and order changes.
  // When dragging: only sync ID additions/removals (not order), to avoid
  // clobbering the in-progress drag reorder.
  $effect(() => {
    const newIds = new Set(assets.map((a) => a.id));
    const currentIds = new Set(displayAssets.map((a) => a.id));

    const idsChanged = newIds.size !== currentIds.size || ![...newIds].every((id) => currentIds.has(id));

    if (!isDragging && !idsChanged) {
      // Not dragging, same IDs — sync order if it changed remotely
      const orderChanged = assets.some((a, i) => displayAssets[i]?.id !== a.id);
      if (orderChanged) {
        displayAssets = [...assets];
      }
    } else if (idsChanged) {
      // IDs were added or removed — always sync
      displayAssets = [...assets];
    }
  });

  // --- Pointer-based drag via Svelte action ---
  function dragInitAction(node: HTMLElement, { assetId }: { assetId: string }) {
    const onPointerDown = (e: PointerEvent) => {
      if (node.dataset.interactionMode !== 'reorder') {
        return;
      }
      if (dragState.pointerId !== undefined) {
        return;
      }

      e.preventDefault();
      node.setPointerCapture(e.pointerId);

      dragState.pointerId = e.pointerId;
      dragState.sourceId = assetId;
      dragState.startX = e.clientX;
      dragState.startY = e.clientY;
      dragState.exceededThreshold = false;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId || !dragState.sourceId) {
        return;
      }

      if (!dragState.exceededThreshold) {
        const dx = e.clientX - dragState.startX;
        const dy = e.clientY - dragState.startY;
        if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) {
          return;
        }
        dragState.exceededThreshold = true;
        isDragging = true;
        previousOrder = [...displayAssets];
      }

      dragCursorX = e.clientX;
      dragCursorY = e.clientY;
      e.preventDefault();

      // Throttle DOM queries to once per animation frame to avoid
      // layout thrashing on large albums during 60fps pointermove events.
      if (!dragState.rafPending) {
        dragState.rafPending = true;
        requestAnimationFrame(() => {
          dragState.rafPending = false;
          updateDragReorder(dragCursorX, dragCursorY);
        });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) {
        return;
      }
      node.releasePointerCapture(e.pointerId);
      void finishDrag();
    };

    const onPointerCancel = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) {
        return;
      }
      node.releasePointerCapture(e.pointerId);
      cancelDrag();
    };

    node.addEventListener('pointerdown', onPointerDown);
    node.addEventListener('pointermove', onPointerMove);
    node.addEventListener('pointerup', onPointerUp);
    node.addEventListener('pointercancel', onPointerCancel);

    return {
      destroy() {
        node.removeEventListener('pointerdown', onPointerDown);
        node.removeEventListener('pointermove', onPointerMove);
        node.removeEventListener('pointerup', onPointerUp);
        node.removeEventListener('pointercancel', onPointerCancel);
      },
    };
  }

  function updateDragReorder(clientX: number, clientY: number) {
    if (!dragState.sourceId) {
      return;
    }

    const targetId = getTargetAssetId(clientX, clientY);
    if (!targetId || targetId === dragState.sourceId) {
      dragTargetId = undefined;
      return;
    }

    dragTargetId = targetId;

    const sourceIndex = displayAssets.findIndex((a) => a.id === dragState.sourceId);
    const targetIndex = displayAssets.findIndex((a) => a.id === targetId);
    if (sourceIndex === -1 || targetIndex === -1) {
      return;
    }

    // Determine whether to insert before or after the target tile,
    // based on which side of the target the cursor is on.
    // This prevents the source from getting "stuck" before the target
    // and needing the cursor to cross the entire tile to advance.
    const targetEl = document.querySelector<HTMLElement>(`[data-asset-id="${targetId}"]`);
    let insertAfterTarget = false;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      // Insert after when cursor is to the right of the target center.
      // Using only the horizontal axis gives a clean 50/50 split and
      // works correctly for both forward and backward drag directions
      // without oscillation — the grid flows left-to-right per row.
      insertAfterTarget = clientX > cx;
    }

    let insertIndex = insertAfterTarget ? targetIndex + 1 : targetIndex;
    // Adjust for source removal: if source is before insert point, removal shifts it left
    if (sourceIndex < insertIndex) {
      insertIndex--;
    }
    if (sourceIndex === insertIndex) {
      return; // No change — prevents adjacent-element oscillation
    }

    previousOrder ??= [...displayAssets];

    const next = [...displayAssets];
    const [moved] = next.splice(sourceIndex, 1);
    next.splice(insertIndex, 0, moved);
    displayAssets = next;
  }

  function getTargetAssetId(clientX: number, clientY: number): string | undefined {
    const grid = document.querySelector('[data-reorder-grid]');
    if (!grid) {
      return undefined;
    }

    const tiles = grid.querySelectorAll<HTMLElement>('[data-asset-id]');
    let bestId: string | undefined;
    let bestDist = Infinity;
    let currentTargetDist = Infinity;

    for (const tile of tiles) {
      const id = tile.dataset.assetId;
      if (!id || id === dragState.sourceId) {
        continue;
      }

      // getBoundingClientRect includes CSS transforms, so it reflects
      // visual positions during FLIP animations — direction-agnostic
      const rect = tile.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dist = Math.hypot(clientX - cx, clientY - cy);

      if (id === dragTargetId) {
        currentTargetDist = dist;
      }

      if (dist < bestDist) {
        bestDist = dist;
        bestId = id;
      }
    }

    // Hysteresis: don't switch away from the current target unless
    // the new candidate is at least HYSTERESIS_PX closer.
    // This prevents rapid oscillation when dragging between rows.
    if (
      dragTargetId &&
      bestId &&
      bestId !== dragTargetId &&
      currentTargetDist < Infinity &&
      currentTargetDist - bestDist < HYSTERESIS_PX
    ) {
      return dragTargetId;
    }

    return bestId;
  }

  function clearDragVisuals() {
    dragState.pointerId = undefined;
    dragState.sourceId = undefined;
    dragState.exceededThreshold = false;
    dragState.rafPending = false;
    dragTargetId = undefined;
  }

  function resetDragState() {
    previousOrder = null;
    isDragging = false;
    clearDragVisuals();
  }

  // --- Finish / cancel drag ---
  async function finishDrag() {
    if (!dragState.sourceId) {
      return;
    }

    if (dragState.exceededThreshold) {
      const movedId = dragState.sourceId;
      const allIds = displayAssets.map((a) => a.id);
      const fallbackOrder = previousOrder;

      // Clear visual drag feedback immediately (thumbnail, highlights) but
      // keep isDragging = true so the sync $effect won't clobber
      // displayAssets with the parent's stale order during the API call.
      clearDragVisuals();

      // Save in background, non-blocking for the UI
      const success = await handleMoveAlbumAsset(album.id, {
        assetId: movedId,
        assetIds: allIds,
      });

      // Now complete the drag — update parent state BEFORE releasing
      // isDragging, so the $effect sees the new order when it fires.
      if (!success && fallbackOrder) {
        displayAssets = fallbackOrder; // Triggers FLIP animation back
      } else if (success) {
        onReorder?.([...displayAssets]);
      }
      isDragging = false;
      previousOrder = null;
    } else {
      // tap → click (no threshold exceeded)
      const clickedAsset = displayAssets.find((a) => a.id === dragState.sourceId);
      resetDragState();
      if (clickedAsset) {
        onClickAsset?.(clickedAsset);
      }
    }
  }

  function cancelDrag() {
    if (previousOrder) {
      displayAssets = previousOrder;
    }
    resetDragState();
  }

  // --- Select mode ---
  function toggleSelection(asset: TimelineAsset) {
    if (assetMultiSelectManager.hasSelectedAsset(asset.id)) {
      assetMultiSelectManager.removeAssetFromMultiselectGroup(asset.id);
    } else {
      assetMultiSelectManager.selectAsset(asset);
    }
  }
</script>

<div class="relative">
  {#if isDragging && dragSourceAsset}
    <div
      class="pointer-events-none fixed z-50 overflow-hidden rounded-lg shadow-2xl"
      style="width: 140px; height: 140px; left: {dragCursorX - 70}px; top: {dragCursorY -
        70}px; transform: scale(1.05);"
    >
      <Thumbnail asset={dragSourceAsset} readonly={true} />
    </div>
  {/if}

  <div
    data-reorder-grid
    role="application"
    class="grid gap-2 p-2"
    class:touch-none={interactionMode === 'reorder'}
    style="grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));"
    ondragstart={(e) => e.preventDefault()}
  >
    {#each displayAssets as asset (asset.id)}
      <div
        data-asset-id={asset.id}
        data-interaction-mode={interactionMode}
        use:dragInitAction={{ assetId: asset.id }}
        class="drag-item-container relative"
        class:cursor-grab={interactionMode === 'reorder'}
        class:active:cursor-grabbing={interactionMode === 'reorder'}
        class:opacity-40={isDragging && dragState.sourceId !== undefined && dragState.sourceId !== asset.id}
        class:scale-95={isDragging && dragState.sourceId !== undefined && dragState.sourceId !== asset.id}
        class:z-10={dragState.sourceId === asset.id && isDragging}
        class:shadow-xl={dragState.sourceId === asset.id && isDragging}
        animate:flip={{ duration: 150 }}
      >
        {#if interactionMode === 'reorder'}
          <div
            class="pointer-events-none absolute top-1 left-1 z-10 rounded-sm bg-black/40 p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
            class:opacity-100={dragState.sourceId === asset.id}
          >
            <Icon icon={mdiDragVertical} size="16" color="white" />
          </div>
        {/if}

        {#if interactionMode === 'reorder' && asset.id === dragTargetId}
          <div class="pointer-events-none absolute inset-0 z-10 rounded-lg border-2 border-primary bg-primary/10"></div>
        {/if}

        <div class="group drag-image relative aspect-square overflow-hidden rounded-lg">
          <Thumbnail
            {asset}
            readonly={interactionMode === 'reorder'}
            selected={interactionMode === 'select' ? assetMultiSelectManager.hasSelectedAsset(asset.id) : false}
            onClick={onClickAsset}
            onSelect={interactionMode === 'select' ? () => toggleSelection(asset) : undefined}
          />
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .drag-item-container :global([data-thumbnail-focus-container]) {
    width: 100% !important;
    height: 100% !important;
  }
  .drag-item-container :global(img) {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover;
    -webkit-user-drag: none;
    user-select: none;
  }
</style>
