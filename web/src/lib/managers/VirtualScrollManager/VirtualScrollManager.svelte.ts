import type { TimelineAsset, Viewport } from '$lib/managers/timeline-manager/types';
import { setDifferenceInPlace } from '$lib/managers/timeline-manager/utils.svelte';
import type { ScrollSegment, SegmentIdentifier } from '$lib/managers/VirtualScrollManager/ScrollSegment.svelte';
import { updateObject } from '$lib/managers/VirtualScrollManager/utils.svelte';

import { clamp, debounce } from 'lodash-es';

export type VisibleWindow = {
  top: number;
  bottom: number;
};
export type AssetOperation = (asset: TimelineAsset) => unknown;

type LayoutOptions = {
  headerHeight: number;
  rowHeight: number;
  gap: number;
};
type ViewportTopSegmentIntersection = {
  segment: ScrollSegment | null;
  // Where viewport top intersects segment (0 = segment top, 1 = segment bottom)
  viewportTopSegmentRatio: number;
  // Where first segment bottom is in viewport (0 = viewport top, 1 = viewport bottom)
  segmentBottomViewportRatio: number;
};

export abstract class VirtualScrollManager {
  topSectionHeight = $state(0);
  bodySectionHeight = $derived.by(() => {
    let height = 0;
    for (const segment of this.segments) {
      height += segment.height;
    }
    return height;
  });
  bottomSectionHeight = $state(0);
  totalViewerHeight = $derived.by(() => this.topSectionHeight + this.bodySectionHeight + this.bottomSectionHeight);
  isInitialized = $state(false);
  streamViewerHeight = $derived.by(() => {
    let height = this.topSectionHeight;
    for (const segment of this.segments) {
      height += segment.height;
    }
    return height;
  });
  assetCount = $derived.by(() => {
    let count = 0;
    for (const segment of this.segments) {
      count += segment.assetsCount;
    }
    return count;
  });
  visibleWindow: VisibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));
  viewportTopSegmentIntersection: ViewportTopSegmentIntersection | undefined;

  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);
  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resumeTransitionsAfterDelay = debounce(() => (this.suspendTransitions = false), 1000);
  #resumeScrollingStatusAfterDelay = debounce(() => (this.#scrolling = false), 1000);
  #justifiedLayoutOptions = $derived({
    spacing: 2,
    heightTolerance: 0.5,
    rowHeight: this.#rowHeight,
    rowWidth: Math.floor(this.viewportWidth),
  });
  #updatingIntersections = false;

  constructor() {
    this.setLayoutOptions();
  }

  get scrollTop() {
    return 0;
  }

  get justifiedLayoutOptions() {
    return this.#justifiedLayoutOptions;
  }

  abstract get segments(): ScrollSegment[];

  get maxScrollPercent() {
    const totalHeight = this.totalViewerHeight;
    return (totalHeight - this.viewportHeight) / totalHeight;
  }

  get maxScroll() {
    return this.totalViewerHeight - this.viewportHeight;
  }

  #setHeaderHeight(value: number) {
    if (this.#headerHeight == value) {
      return false;
    }
    this.#headerHeight = value;
    return true;
  }

  get headerHeight() {
    return this.#headerHeight;
  }

  #setGap(value: number) {
    if (this.#gap == value) {
      return false;
    }
    this.#gap = value;
    return true;
  }

  get gap() {
    return this.#gap;
  }

  #setRowHeight(value: number) {
    if (this.#rowHeight == value) {
      return false;
    }
    this.#rowHeight = value;
    return true;
  }

  get rowHeight() {
    return this.#rowHeight;
  }

  set scrolling(value: boolean) {
    this.#scrolling = value;
    if (value) {
      this.suspendTransitions = true;
      this.#resumeScrollingStatusAfterDelay();
    }
  }

  get scrolling() {
    return this.#scrolling;
  }

  set suspendTransitions(value: boolean) {
    this.#suspendTransitions = value;
    if (value) {
      this.#resumeTransitionsAfterDelay();
    }
  }

  get suspendTransitions() {
    return this.#suspendTransitions;
  }

  set viewportWidth(value: number) {
    const oldViewport = this.viewportSnapshot;
    this.#viewportWidth = value;
    this.suspendTransitions = true;
    const newViewport = this.viewportSnapshot;
    void this.onUpdateViewport(oldViewport, newViewport);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    const oldViewport = this.viewportSnapshot;
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    const newViewport = this.viewportSnapshot;
    void this.onUpdateViewport(oldViewport, newViewport);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  get viewportSnapshot(): Viewport {
    return {
      width: $state.snapshot(this.#viewportWidth),
      height: $state.snapshot(this.#viewportHeight),
    };
  }

  scrollTo(_: number) {}

  scrollBy(_: number) {}

  #calculateSegmentBottomViewportRatio(segment: ScrollSegment | null) {
    if (!segment) {
      return 0;
    }
    const windowHeight = this.visibleWindow.bottom - this.visibleWindow.top;
    const bottomOfSegment = segment.top + segment.height;
    const bottomOfSegmentInViewport = bottomOfSegment - this.visibleWindow.top;
    return clamp(bottomOfSegmentInViewport / windowHeight, 0, 1);
  }

  #calculateViewportTopRatioInMonth(month: ScrollSegment | null) {
    if (!month) {
      return 0;
    }
    return clamp((this.visibleWindow.top - month.top) / month.height, 0, 1);
  }

  protected updateIntersections() {
    if (this.#updatingIntersections || !this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }

    this.#updatingIntersections = true;
    let topSegment: ScrollSegment | null = null;
    for (const segment of this.segments) {
      segment.calculateAndUpdateIntersection(this.visibleWindow);
      if (segment.actuallyIntersecting && topSegment === null) {
        topSegment = segment;
      }
    }

    const viewportTopSegmentRatio = this.#calculateViewportTopRatioInMonth(topSegment);
    const segmentBottomViewportRatio = this.#calculateSegmentBottomViewportRatio(topSegment);

    this.viewportTopSegmentIntersection = {
      segment: topSegment,
      viewportTopSegmentRatio,
      segmentBottomViewportRatio,
    };

    this.#updatingIntersections = false;
  }

  protected onUpdateViewport(oldViewport: Viewport, newViewport: Viewport) {
    if (!this.isInitialized || isEmptyViewport(newViewport)) {
      return;
    }
    const changedWidth = oldViewport.width !== newViewport.width || isEmptyViewport(oldViewport);
    this.refreshLayout({ invalidateHeight: changedWidth });
  }

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: Partial<LayoutOptions> = {}) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    if (changed) {
      this.refreshLayout();
    }
  }

  updateVisibleWindow() {
    const scrollTop = this.scrollTop;
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateIntersections();
    }
  }

  protected refreshLayout({ invalidateHeight = true }: { invalidateHeight?: boolean } = {}) {
    for (const segment of this.segments) {
      segment.updateGeometry({ invalidateHeight });
    }
    this.updateIntersections();
  }

  destroy() {
    this.isInitialized = false;
  }

  async loadSegment(identifier: SegmentIdentifier, options?: { cancelable: boolean }): Promise<void> {
    const { cancelable = true } = options ?? {};
    const segment = this.segments.find((segment) => identifier.matches(segment));
    if (!segment || segment.loader?.executed) {
      return;
    }

    await segment.load(cancelable);
  }

  upsertAssets(assets: TimelineAsset[]) {
    const notExcluded = assets.filter((asset) => !this.isExcluded(asset));
    const notUpdated = this.#updateAssets(notExcluded);
    this.addAssetsToSegments(notUpdated);
  }

  removeAssets(ids: string[]) {
    this.#runAssetOperation(ids, () => ({ remove: true }));
  }

  /**
   * Executes the given operation against every passed in asset id.
   *
   * @returns An object with the changed ids, unprocessed ids, and if this resulted
   * in changes of the timeline geometry.
   */
  updateAssetOperation(ids: string[], operation: AssetOperation) {
    return this.#runAssetOperation(ids, operation);
  }

  isExcluded(_: TimelineAsset) {
    return false;
  }

  protected addAssetsToSegments(assets: TimelineAsset[]) {
    if (assets.length === 0) {
      return;
    }
    const context = this.createUpsertContext();
    const monthCount = this.segments.length;
    for (const asset of assets) {
      this.upsertAssetIntoSegment(asset, context);
    }
    if (this.segments.length !== monthCount) {
      this.postCreateSegments();
    }
    this.postUpsert(context);
    this.updateIntersections();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected upsertAssetIntoSegment(asset: TimelineAsset, context: unknown): void {}
  protected createUpsertContext(): unknown {
    return undefined;
  }
  protected postUpsert(_: unknown): void {}
  protected postCreateSegments(): void {}

  /**
     * Looks up the specified asset from the TimelineAsset using its id, and then updates the
     * existing object to match the rest of the TimelineAsset parameter.
  
     * @returns list of assets that were updated (not found)
     */
  #updateAssets(updatedAssets: TimelineAsset[]) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const lookup = new Map<string, TimelineAsset>();
    const ids = [];
    for (const asset of updatedAssets) {
      ids.push(asset.id);
      lookup.set(asset.id, asset);
    }
    const { unprocessedIds } = this.#runAssetOperation(ids, (asset) => updateObject(asset, lookup.get(asset.id)));
    const result: TimelineAsset[] = [];
    for (const id of unprocessedIds) {
      result.push(lookup.get(id)!);
    }
    return result;
  }

  #runAssetOperation(ids: string[], operation: AssetOperation) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const changedMonths = new Set<ScrollSegment>();
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const idsToProcess = new Set(ids);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: TimelineAsset[] = [];
    for (const month of this.segments) {
      if (idsToProcess.size > 0) {
        const { moveAssets, processedIds, changedGeometry } = month.runAssetOperation(idsToProcess, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(...moveAssets);
        }
        setDifferenceInPlace(idsToProcess, processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedMonths.add(month);
        }
      }
    }
    if (combinedMoveAssets.length > 0) {
      this.addAssetsToSegments(combinedMoveAssets);
    }
    const changedGeometry = changedMonths.size > 0;
    for (const month of changedMonths) {
      month.updateGeometry({ invalidateHeight: true });
    }
    if (changedGeometry) {
      this.updateIntersections();
    }
    return { unprocessedIds: idsToProcess, processedIds: idsProcessed, changedGeometry };
  }
}

export const isEmptyViewport = (viewport: Viewport) => viewport.width === 0 || viewport.height === 0;
