import type { TimelineAsset, UpdateGeometryOptions } from '$lib/managers/timeline-manager/types';
import type { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import type {
  AssetOperation,
  VirtualScrollManager,
  VisibleWindow,
} from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { CancellableTask, TaskStatus } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import { TUNABLES } from '$lib/utils/tunables';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

export type SegmentIdentifier = {
  get id(): string;
  matches(segment: ScrollSegment): boolean;
};
export abstract class ScrollSegment {
  #intersecting = $state(false);
  #actuallyIntersecting = $state(false);
  #isLoaded = $state(false);
  #height = $state(0);
  #top = $state(0);
  #assets = $derived.by(() => this.viewerAssets.map((viewerAsset) => viewerAsset.asset));

  initialCount = $state(0);
  percent = $state(0);
  isHeightActual = $state(false);
  assetsCount = $derived.by(() => (this.loaded ? this.viewerAssets.length : this.initialCount));
  loader = new CancellableTask(
    () => (this.loaded = true),
    () => (this.loaded = false),
    () => this.handleLoadError,
  );

  abstract get scrollManager(): VirtualScrollManager;

  abstract get identifier(): SegmentIdentifier;

  abstract get viewerAssets(): ViewerAsset[];

  abstract findAssetAbsolutePosition(assetId: string): { top: number; height: number } | undefined;

  protected abstract fetch(signal: AbortSignal): Promise<unknown>;

  get loaded() {
    return this.#isLoaded;
  }

  protected set loaded(newValue: boolean) {
    this.#isLoaded = newValue;
  }

  get intersecting() {
    return this.#intersecting;
  }

  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old === newValue) {
      return;
    }
    this.#intersecting = newValue;
    if (newValue) {
      void this.load(true);
    } else {
      this.cancel();
    }
  }

  get actuallyIntersecting() {
    return this.#actuallyIntersecting;
  }

  get assets(): TimelineAsset[] {
    return this.#assets;
  }

  get height() {
    return this.#height;
  }

  set height(height: number) {
    if (this.#height === height) {
      return;
    }
    const scrollManager = this.scrollManager;
    const index = scrollManager.segments.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const prevSegment = scrollManager.segments[index - 1];
    if (prevSegment) {
      const newTop = prevSegment.#top + prevSegment.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    if (heightDelta === 0) {
      return;
    }
    for (let cursor = index + 1; cursor < scrollManager.segments.length; cursor++) {
      const segment = this.scrollManager.segments[cursor];
      const newTop = segment.#top + heightDelta;
      if (segment.#top !== newTop) {
        segment.#top = newTop;
      }
    }
    if (!scrollManager.viewportTopSegmentIntersection) {
      return;
    }

    const { segment, viewportTopSegmentRatio, segmentBottomViewportRatio } =
      scrollManager.viewportTopSegmentIntersection;

    const currentIndex = segment ? scrollManager.segments.indexOf(segment) : -1;
    if (!segment || currentIndex <= 0 || index > currentIndex) {
      return;
    }
    if (index < currentIndex || segmentBottomViewportRatio < 1) {
      scrollManager.scrollBy(heightDelta);
    } else if (index === currentIndex) {
      const scrollTo = this.top + heightDelta * viewportTopSegmentRatio;
      scrollManager.scrollTo(scrollTo);
    }
  }

  get top(): number {
    return this.#top + this.scrollManager.topSectionHeight;
  }

  async load(cancelable: boolean): Promise<TaskStatus> {
    const result = await this.loader?.execute(async (signal: AbortSignal) => {
      await this.fetch(signal);
    }, cancelable);
    if (result === TaskStatus.LOADED) {
      this.updateGeometry({ invalidateHeight: false });
      this.calculateAndUpdateIntersection(this.scrollManager.visibleWindow);
    }
    return result;
  }

  protected handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  cancel() {
    this.loader?.cancel();
  }

  updateIntersection({ intersecting, actuallyIntersecting }: { intersecting: boolean; actuallyIntersecting: boolean }) {
    this.intersecting = intersecting;
    this.#actuallyIntersecting = actuallyIntersecting;
  }

  updateGeometry(options: UpdateGeometryOptions) {
    const { invalidateHeight = true, noDefer = false } = options;
    if (invalidateHeight) {
      this.isHeightActual = false;
    }
    if (!this.loaded) {
      const viewportWidth = this.scrollManager.viewportWidth;
      if (!this.isHeightActual) {
        const unwrappedWidth = (3 / 2) * this.assetsCount * this.scrollManager.rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.scrollManager.rowHeight;
        this.height = height;
      }
      return;
    }
    this.layout(noDefer);
  }

  layout(_: boolean) {}

  protected calculateSegmentIntersecting(visibleWindow: VisibleWindow, expandTop: number, expandBottom: number) {
    const segmentTop = this.top;
    const segmentBottom = segmentTop + this.height;
    const topWindow = visibleWindow.top - expandTop;
    const bottomWindow = visibleWindow.bottom + expandBottom;

    return isIntersecting(segmentTop, segmentBottom, topWindow, bottomWindow);
  }

  calculateAndUpdateIntersection(visibleWindow: VisibleWindow) {
    const actuallyIntersecting = this.calculateSegmentIntersecting(visibleWindow, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.calculateSegmentIntersecting(
        visibleWindow,
        INTERSECTION_EXPAND_TOP,
        INTERSECTION_EXPAND_BOTTOM,
      );
    }
    this.updateIntersection({ intersecting: actuallyIntersecting || preIntersecting, actuallyIntersecting });
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const unprocessedIds = new Set<string>(ids);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const processedIds = new Set<string>();
    const moveAssets: TimelineAsset[] = [];
    let changedGeometry = false;
    for (const assetId of unprocessedIds) {
      const index = this.viewerAssets.findIndex((viewAsset) => viewAsset.id == assetId);
      if (index === -1) {
        continue;
      }

      const asset = this.viewerAssets[index].asset!;
      const opResult = operation(asset);
      let remove = false;
      if (opResult) {
        remove = (opResult as { remove: boolean }).remove ?? false;
      }

      unprocessedIds.delete(assetId);
      processedIds.add(assetId);
      if (remove || this.scrollManager.isExcluded(asset)) {
        this.viewerAssets.splice(index, 1);
        changedGeometry = true;
      }
    }
    return { moveAssets, processedIds, unprocessedIds, changedGeometry };
  }
}

/**
 * General function to check if a segment region intersects with a window region.
 * @param regionTop - Top position of the region to check
 * @param regionBottom - Bottom position of the region to check
 * @param windowTop - Top position of the window
 * @param windowBottom - Bottom position of the window
 * @returns true if the region intersects with the window
 */
export const isIntersecting = (regionTop: number, regionBottom: number, windowTop: number, windowBottom: number) =>
  (regionTop >= windowTop && regionTop < windowBottom) ||
  (regionBottom >= windowTop && regionBottom < windowBottom) ||
  (regionTop < windowTop && regionBottom >= windowBottom);
