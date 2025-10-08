import type { AssetStreamSegment, SegmentIdentifier } from '$lib/managers/AssetStreamManager/AssetStreamSegment.svelte';
import type { AssetDescriptor, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { CancellableTask, TaskStatus } from '$lib/utils/cancellable-task';
import { TUNABLES } from '$lib/utils/tunables';
import { clamp, debounce } from 'lodash-es';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export abstract class AssetStreamManager {
  isInitialized = $state(false);
  topSectionHeight = $state(0);
  bottomSectionHeight = $state(60);

  streamViewerHeight = $derived.by(
    () => this.segments.reduce((accumulator, b) => accumulator + b.height, 0) + this.topSectionHeight,
  );
  assetCount = $derived.by(() => this.segments.reduce((accumulator, b) => accumulator + b.assetsCount, 0));

  topIntersectingSegment: AssetStreamSegment | undefined = $state();

  visibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));

  protected initTask = new CancellableTask(
    () => (this.isInitialized = true),
    () => (this.isInitialized = false),
    () => void 0,
  );

  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);

  #rowHeight = $state(235);
  #headerHeight = $state(48);
  #gap = $state(12);

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);
  scrollCompensation: {
    heightDelta: number | undefined;
    scrollTop: number | undefined;
    segment: AssetStreamSegment | undefined;
  } = $state({
    heightDelta: 0,
    scrollTop: 0,
    segment: undefined,
  });

  constructor() {}

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    if (changed) {
      this.refreshLayout();
    }
  }

  abstract get segments(): AssetStreamSegment[];

  get maxScrollPercent() {
    const totalHeight = this.streamViewerHeight + this.bottomSectionHeight + this.topSectionHeight;
    return (totalHeight - this.viewportHeight) / totalHeight;
  }

  get maxScroll() {
    return this.topSectionHeight + this.bottomSectionHeight + (this.streamViewerHeight - this.viewportHeight);
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
      this.#resetScrolling();
    }
  }

  get scrolling() {
    return this.#scrolling;
  }

  set suspendTransitions(value: boolean) {
    this.#suspendTransitions = value;
    if (value) {
      this.#resetSuspendTransitions();
    }
  }

  get suspendTransitions() {
    return this.#suspendTransitions;
  }

  set viewportWidth(value: number) {
    const changed = value !== this.#viewportWidth;
    this.#viewportWidth = value;
    this.suspendTransitions = true;
    void this.updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    void this.updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  get hasEmptyViewport() {
    return this.viewportWidth === 0 || this.viewportHeight === 0;
  }

  updateSlidingWindow(scrollTop: number) {
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateIntersections();
    }
  }

  clearScrollCompensation() {
    this.scrollCompensation = {
      heightDelta: undefined,
      scrollTop: undefined,
      segment: undefined,
    };
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingSegment = undefined;
    for (const segment of this.segments) {
      this.updateSegmentIntersections(segment);
      if (!topIntersectingSegment && segment.actuallyIntersecting) {
        topIntersectingSegment = segment;
      }
    }
    if (topIntersectingSegment !== undefined && this.topIntersectingSegment !== topIntersectingSegment) {
      this.topIntersectingSegment = topIntersectingSegment;
    }
    for (const segment of this.segments) {
      if (segment === this.topIntersectingSegment) {
        this.topIntersectingSegment.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingSegment.top) / this.topIntersectingSegment.height,
          0,
          1,
        );
      } else {
        segment.percent = 0;
      }
    }
  }

  async init() {
    this.isInitialized = false;
    await this.initTask.execute(() => Promise.resolve(undefined), true);
  }

  destroy() {
    this.isInitialized = false;
  }

  protected updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized || this.hasEmptyViewport) {
      return;
    }
    for (const segment of this.segments) {
      segment.updateGeometry({ invalidateHeight: changedWidth });
    }
    this.updateIntersections();
  }

  createLayoutOptions() {
    const viewportWidth = this.viewportWidth;

    return {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight: this.#rowHeight,
      rowWidth: Math.floor(viewportWidth),
    };
  }

  async loadSegment(identifier: SegmentIdentifier, options?: { cancelable: boolean }): Promise<void> {
    const { cancelable = true } = options ?? {};
    const segment = this.segments.find((segment) => identifier.matches(segment));
    if (!segment || segment.loader?.executed) {
      return;
    }

    const result = await segment.load(cancelable);
    if (result === TaskStatus.LOADED) {
      this.updateSegmentIntersections(segment);
    }
  }

  getSegmentForAssetId(assetId: string) {
    for (const segment of this.segments) {
      const asset = segment.assets.find((asset) => asset.id === assetId);
      if (asset) {
        return segment;
      }
    }
  }

  refreshLayout() {
    for (const segment of this.segments) {
      segment.updateGeometry({ invalidateHeight: true });
    }
    this.updateIntersections();
  }

  retrieveRange(start: AssetDescriptor, end: AssetDescriptor): Promise<TimelineAsset[]> {
    const range: TimelineAsset[] = [];
    let collecting = false;

    for (const segment of this.segments) {
      for (const asset of segment.assets) {
        if (asset.id === start.id) {
          collecting = true;
        }
        if (collecting) {
          range.push(asset);
        }
        if (asset.id === end.id) {
          return Promise.resolve(range);
        }
      }
    }
    return Promise.resolve(range);
  }

  protected calculateSegmentIntersecting(segment: AssetStreamSegment, expandTop: number, expandBottom: number) {
    const monthGroupTop = segment.top;
    const monthGroupBottom = monthGroupTop + segment.height;
    const topWindow = this.visibleWindow.top - expandTop;
    const bottomWindow = this.visibleWindow.bottom + expandBottom;

    return isIntersecting(monthGroupTop, monthGroupBottom, topWindow, bottomWindow);
  }

  protected updateSegmentIntersections(segment: AssetStreamSegment) {
    const actuallyIntersecting = this.calculateSegmentIntersecting(segment, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.calculateSegmentIntersecting(segment, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    segment.updateIntersection({ intersecting: actuallyIntersecting || preIntersecting, actuallyIntersecting });
  }
}

/**
 * General function to check if a rectangular region intersects with a window.
 * @param regionTop - Top position of the region to check
 * @param regionBottom - Bottom position of the region to check
 * @param windowTop - Top position of the window
 * @param windowBottom - Bottom position of the window
 * @returns true if the region intersects with the window
 */
export function isIntersecting(regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) {
  return (
    (regionTop >= windowTop && regionTop < windowBottom) ||
    (regionBottom >= windowTop && regionBottom < windowBottom) ||
    (regionTop < windowTop && regionBottom >= windowBottom)
  );
}
