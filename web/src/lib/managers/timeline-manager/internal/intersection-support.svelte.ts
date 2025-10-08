import { isIntersecting, type AssetStreamManager } from '$lib/managers/AssetStreamManager/AssetStreamManager.svelte';
import { TUNABLES } from '$lib/utils/tunables';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

/**
 * Calculate intersection for viewer assets with additional parameters like header height and scroll compensation
 */
export function calculateViewerAssetIntersecting(
  assetStreamManager: AssetStreamManager,
  positionTop: number,
  positionHeight: number,
  expandTop: number = INTERSECTION_EXPAND_TOP,
  expandBottom: number = INTERSECTION_EXPAND_BOTTOM,
) {
  const scrollCompensationHeightDelta = assetStreamManager.scrollCompensation?.heightDelta ?? 0;

  const topWindow =
    assetStreamManager.visibleWindow.top - assetStreamManager.headerHeight - expandTop + scrollCompensationHeightDelta;
  const bottomWindow =
    assetStreamManager.visibleWindow.bottom +
    assetStreamManager.headerHeight +
    expandBottom +
    scrollCompensationHeightDelta;

  const positionBottom = positionTop + positionHeight;

  return isIntersecting(positionTop, positionBottom, topWindow, bottomWindow);
}
