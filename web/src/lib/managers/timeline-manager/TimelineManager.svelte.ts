import { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import type { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { GroupInsertionCache } from '$lib/managers/timeline-manager/TimelineInsertionCache.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import { TimelineSearchExtension } from '$lib/managers/timeline-manager/TimelineSearchExtension.svelte';
import { TimelineWebsocketExtension } from '$lib/managers/timeline-manager/TimelineWebsocketExtension';
import type {
  Direction,
  ScrubberMonth,
  TimelineAsset,
  TimelineManagerOptions,
  Viewport,
} from '$lib/managers/timeline-manager/types';
import { isMismatched } from '$lib/managers/timeline-manager/utils.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { getSegmentIdentifier } from '$lib/utils/timeline-util';
import { AssetOrder, getTimeBuckets } from '@immich/sdk';
import { isEqual } from 'lodash-es';
import { SvelteDate, SvelteSet } from 'svelte/reactivity';

export class TimelineManager extends VirtualScrollManager {
  override bottomSectionHeight = $state(60);
  readonly search = new TimelineSearchExtension(this);
  readonly websocket = new TimelineWebsocketExtension(this);
  readonly albumAssets: Set<string> = new SvelteSet();
  readonly limitedScroll = $derived(this.maxScrollPercent < 0.5);
  readonly initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
      if (this.#options.albumId || this.#options.personId) {
        return;
      }
      this.websocket.connect();
    },
    () => {
      this.websocket.disconnect();
      this.isInitialized = false;
    },
    () => void 0,
  );

  segments: TimelineMonth[] = $state([]);
  scrubberMonths: ScrubberMonth[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  #options: TimelineManagerOptions = {};
  #scrollableElement: HTMLElement | undefined = $state();

  constructor() {
    super();
  }

  get options() {
    return this.#options;
  }

  override get scrollTop(): number {
    return this.#scrollableElement?.scrollTop ?? 0;
  }

  set scrollableElement(element: HTMLElement | undefined) {
    this.#scrollableElement = element;
  }

  override scrollTo(top: number) {
    this.#scrollableElement?.scrollTo({ top });
    this.updateVisibleWindow();
  }

  override scrollBy(y: number) {
    this.#scrollableElement?.scrollBy(0, y);
    this.updateVisibleWindow();
  }

  protected override refreshLayout({ invalidateHeight = true }: { invalidateHeight?: boolean } = {}) {
    super.refreshLayout({ invalidateHeight });
    if (invalidateHeight) {
      this.#createScrubberMonths();
    }
  }

  public override destroy() {
    this.websocket.disconnect();
    super.destroy();
  }

  async updateOptions(options: TimelineManagerOptions) {
    if (options.deferInit) {
      return;
    }
    if (isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
    this.refreshLayout();
  }

  async updateViewport(viewport: Viewport) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }

    if (this.viewportHeight === viewport.height && this.viewportWidth === viewport.width) {
      return;
    }

    if (!this.initTask.executed) {
      await (this.initTask.loading ? this.initTask.waitUntilCompletion() : this.#init(this.#options));
    }

    const oldViewport: Viewport = {
      width: this.viewportWidth,
      height: this.viewportHeight,
    };

    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    this.onUpdateViewport(oldViewport, viewport);
  }

  protected override createUpsertContext(): GroupInsertionCache {
    return new GroupInsertionCache();
  }

  protected override upsertAssetIntoSegment(asset: TimelineAsset, context: GroupInsertionCache): void {
    let month = this.search.findMonthByDate(asset.localDateTime);

    if (!month) {
      month = new TimelineMonth(this, asset.localDateTime, 1, true, this.#options.order);
      this.segments.push(month);
    }

    month.addTimelineAsset(asset, context);
  }

  protected override postCreateSegments(): void {
    this.segments.sort((a, b) => {
      return a.yearMonth.year === b.yearMonth.year
        ? b.yearMonth.month - a.yearMonth.month
        : b.yearMonth.year - a.yearMonth.year;
    });
  }

  protected override postUpsert(context: GroupInsertionCache): void {
    for (const group of context.existingDays) {
      group.sortAssets(this.#options.order);
    }

    for (const month of context.monthsWithNewDays) {
      month.sortDays();
    }

    for (const month of context.updatedMonths) {
      month.sortDays();
      month.updateGeometry({ invalidateHeight: true });
    }
  }

  override isExcluded(asset: TimelineAsset) {
    return (
      isMismatched(this.#options.visibility, asset.visibility) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed, asset.isTrashed)
    );
  }

  getAssetOrder() {
    return this.#options.order ?? AssetOrder.Desc;
  }

  getFirstAsset(): TimelineAsset | undefined {
    return this.segments[0]?.getFirstAsset();
  }

  async *assetsIterator(options?: {
    startMonth?: TimelineMonth;
    startDay?: TimelineDay;
    startAsset?: TimelineAsset;
    direction?: Direction;
  }) {
    const direction = options?.direction ?? 'earlier';
    let { startDay, startAsset } = options ?? {};
    for (const month of this.monthIterator({ direction, startMonth: options?.startMonth })) {
      await this.loadSegment(getSegmentIdentifier(month.yearMonth), { cancelable: false });
      yield* month.assetsIterator({ startDay, startAsset, direction });
      startDay = startAsset = undefined;
    }
  }

  *monthIterator(options?: { direction?: Direction; startMonth?: TimelineMonth }) {
    const isEarlier = options?.direction === 'earlier';
    let startIndex = options?.startMonth
      ? this.segments.indexOf(options.startMonth)
      : isEarlier
        ? 0
        : this.segments.length - 1;

    while (startIndex >= 0 && startIndex < this.segments.length) {
      yield this.segments[startIndex];
      startIndex += isEarlier ? 1 : -1;
    }
  }

  async #init(options: TimelineManagerOptions) {
    this.isInitialized = false;
    this.segments = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      const timebuckets = await getTimeBuckets({
        ...authManager.params,
        ...this.#options,
      });

      for (const timeBucket of timebuckets) {
        const date = new SvelteDate(timeBucket.timeBucket);
        this.segments.push(
          new TimelineMonth(
            this,
            { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
            timeBucket.count,
            false,
            this.#options.order,
          ),
        );
      }
      this.albumAssets.clear();
    }, true);
    this.refreshLayout();
  }

  #createScrubberMonths() {
    this.scrubberMonths = this.segments.map((month) => ({
      assetCount: month.assetsCount,
      year: month.yearMonth.year,
      month: month.yearMonth.month,
      title: month.monthTitle,
      height: month.height,
    }));
    this.scrubberTimelineHeight = this.totalViewerHeight;
  }
}
