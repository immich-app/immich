import { updateIntersectionMonthGroup } from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
import { updateGeometry } from '$lib/managers/timeline-manager/internal/layout-support.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { clamp, debounce } from 'lodash-es';

import type {
  PhotostreamSegment,
  SegmentIdentifier,
} from '$lib/managers/photostream-manager/PhotostreamSegment.svelte';
import type {
  AssetDescriptor,
  TimelineAsset,
  TimelineManagerLayoutOptions,
  Viewport,
} from '$lib/managers/timeline-manager/types';

export abstract class PhotostreamManager {
  isInitialized = $state(false);
  topSectionHeight = $state(0);
  bottomSectionHeight = $state(60);
  abstract get months(): PhotostreamSegment[];
  timelineHeight = $derived.by(
    () => this.months.reduce((accumulator, b) => accumulator + b.height, 0) + this.topSectionHeight,
  );
  assetCount = $derived.by(() => this.months.reduce((accumulator, b) => accumulator + b.assetsCount, 0));

  topIntersectingMonthGroup: PhotostreamSegment | undefined = $state();

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
    monthGroup: PhotostreamSegment | undefined;
  } = $state({
    heightDelta: 0,
    scrollTop: 0,
    monthGroup: undefined,
  });

  constructor() {}

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: TimelineManagerLayoutOptions) {
    let changed = false;
    changed ||= this.#setHeaderHeight(headerHeight);
    changed ||= this.#setGap(gap);
    changed ||= this.#setRowHeight(rowHeight);
    if (changed) {
      this.refreshLayout();
    }
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
      monthGroup: undefined,
    };
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingMonthGroup = undefined;
    for (const month of this.months) {
      updateIntersectionMonthGroup(this, month);
      if (!topIntersectingMonthGroup && month.actuallyIntersecting) {
        topIntersectingMonthGroup = month;
      }
    }
    if (topIntersectingMonthGroup !== undefined && this.topIntersectingMonthGroup !== topIntersectingMonthGroup) {
      this.topIntersectingMonthGroup = topIntersectingMonthGroup;
    }
    for (const month of this.months) {
      if (month === this.topIntersectingMonthGroup) {
        this.topIntersectingMonthGroup.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingMonthGroup.top) / this.topIntersectingMonthGroup.height,
          0,
          1,
        );
      } else {
        month.percent = 0;
      }
    }
  }

  async init() {
    this.isInitialized = false;
    await this.initTask.execute(() => Promise.resolve(undefined), true);
  }

  public destroy() {
    this.isInitialized = false;
  }

  async updateViewport(viewport: Viewport) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }

    if (this.viewportHeight === viewport.height && this.viewportWidth === viewport.width) {
      return;
    }

    if (!this.initTask.executed) {
      await (this.initTask.loading ? this.initTask.waitUntilCompletion() : this.init());
    }

    const changedWidth = viewport.width !== this.viewportWidth;
    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    this.updateViewportGeometry(changedWidth);
  }

  protected updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }
    for (const month of this.months) {
      updateGeometry(this, month, { invalidateHeight: changedWidth });
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
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const segment = this.getSegmentByIdentifier(identifier);
    if (!segment) {
      return;
    }

    if (segment.loader?.executed) {
      return;
    }

    const result = await segment.load(cancelable);
    if (result === 'LOADED') {
      updateIntersectionMonthGroup(this, segment);
    }
  }

  getSegmentByIdentifier(identifier: SegmentIdentifier) {
    return this.months.find((segment) => identifier.matches(segment));
  }

  getSegmentForAssetId(assetId: string) {
    for (const month of this.months) {
      const asset = month.assets.find((asset) => asset.id === assetId);
      if (asset) {
        return month;
      }
    }
  }

  refreshLayout() {
    for (const month of this.months) {
      updateGeometry(this, month, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getMaxScrollPercent() {
    const totalHeight = this.timelineHeight + this.bottomSectionHeight + this.topSectionHeight;
    return (totalHeight - this.viewportHeight) / totalHeight;
  }

  getMaxScroll() {
    return this.topSectionHeight + this.bottomSectionHeight + (this.timelineHeight - this.viewportHeight);
  }

  retrieveLoadedRange(start: AssetDescriptor, end: AssetDescriptor): TimelineAsset[] {
    const range: TimelineAsset[] = [];
    let collecting = false;

    for (const month of this.months) {
      if (collecting && !month.isLoaded) {
        // if there are any unloaded months in the range, return empty []
        return [];
      }
      for (const asset of month.assets) {
        if (asset.id === start.id) {
          collecting = true;
        }
        if (collecting) {
          range.push(asset);
        }
        if (asset.id === end.id) {
          return range;
        }
      }
    }
    return range;
  }

  retrieveRange(start: AssetDescriptor, end: AssetDescriptor): Promise<TimelineAsset[]> {
    return Promise.resolve(this.retrieveLoadedRange(start, end));
  }
}
