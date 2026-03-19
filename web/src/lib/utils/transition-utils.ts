import { assetViewerManager } from '$lib/managers/asset-viewer-manager.svelte';
import { viewTransitionManager } from '$lib/managers/ViewTransitionManager.svelte';
import { tick } from 'svelte';

function startHeroTransition(
  type: string,
  heroAssetId: string,
  openViewer: () => void,
  activateHeroAsset: (assetId: string) => void,
  deactivateHeroAsset: () => void,
) {
  void viewTransitionManager.startTransition({
    types: [type],
    prepareOldSnapshot: () => {
      activateHeroAsset(heroAssetId);
    },
    performUpdate: async (signal) => {
      deactivateHeroAsset();
      const ready = assetViewerManager.untilNext('ViewerOpenTransitionReady', { signal });
      openViewer();
      await ready;
      assetViewerManager.emit('ViewerOpenTransition');
      await tick();
    },
  });
}

export function startViewerTransition(
  heroAssetId: string,
  openViewer: () => void,
  activateHeroAsset: (assetId: string) => void,
  deactivateHeroAsset: () => void,
) {
  startHeroTransition('viewer', heroAssetId, openViewer, activateHeroAsset, deactivateHeroAsset);
}

export function startMemoryTransition(
  heroAssetId: string,
  openViewer: () => void,
  activateHeroAsset: (assetId: string) => void,
  deactivateHeroAsset: () => void,
) {
  startHeroTransition('memory-enter', heroAssetId, openViewer, activateHeroAsset, deactivateHeroAsset);
}

let activeOverlay: HTMLElement | undefined;

export function removeCrossfadeOverlay() {
  if (activeOverlay) {
    activeOverlay.remove();
    activeOverlay = undefined;
  }
}

export async function crossfadeViewerContent(updateFn: () => void | Promise<void>, duration = 200) {
  const viewerContent = document.querySelector<HTMLElement>('[data-viewer-content]');
  if (!viewerContent) {
    await updateFn();
    return;
  }

  removeCrossfadeOverlay();

  const clone = viewerContent.cloneNode(true) as HTMLElement;
  Object.assign(clone.style, {
    position: 'absolute',
    inset: '0',
    zIndex: '1',
    pointerEvents: 'none',
  });
  delete clone.dataset.viewerContent;
  if (!viewerContent.parentElement) {
    await updateFn();
    return;
  }
  viewerContent.parentElement.append(clone);
  activeOverlay = clone;

  const ready = eventManager.untilNext('ViewerOpenTransitionReady');
  await updateFn();

  try {
    await ready;
  } catch {
    clone.remove();
    if (activeOverlay === clone) {
      activeOverlay = undefined;
    }
    return;
  }

  const fadeOut = clone.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    fill: 'forwards',
  });

  void fadeOut.finished.then(() => {
    clone.remove();
    if (activeOverlay === clone) {
      activeOverlay = undefined;
    }
  });
}
