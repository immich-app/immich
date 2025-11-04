import type { SegmentIdentifier } from '$lib/managers/VirtualScrollManager/ScrollSegment.svelte';
import { VirtualScrollManager } from '$lib/managers/VirtualScrollManager/VirtualScrollManager.svelte';
import { authManager } from '$lib/managers/auth-manager.svelte';
import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { TimelineMonth } from '$lib/managers/timeline-manager/TimelineMonth.svelte';
import { GroupInsertionCache } from '$lib/managers/timeline-manager/group-insertion-cache.svelte';
import {
  findClosestGroupForDate,
  findMonthForAsset as findMonthForAssetUtil,
  findMonthForDate,
  getAssetWithOffset,
  getMonthByDate,
  retrieveRange as retrieveRangeUtil,
} from '$lib/managers/timeline-manager/internal/search-support.svelte';
import { isMismatched, updateObject } from '$lib/managers/timeline-manager/internal/utils.svelte';
import { WebsocketSupport } from '$lib/managers/timeline-manager/internal/websocket-support.svelte';
import type {
  AssetDescriptor,
  AssetOperation,
  Direction,
  ScrubberMonth,
  TimelineAsset,
  TimelineManagerOptions,
  Viewport,
} from '$lib/managers/timeline-manager/types';
import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  getSegmentIdentifier,
  setDifferenceInPlace,
  toTimelineAsset,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';
import { AssetOrder, getAssetInfo, getTimeBuckets } from '@immich/sdk';
import { isEqual } from 'lodash-es';
import { SvelteDate, SvelteSet } from 'svelte/reactivity';

export class TimelineManager extends VirtualScrollManager {
  override bottomSectionHeight = $state(60);

  segments: TimelineMonth[] = $state([]);
  albumAssets: Set<string> = new SvelteSet();
  scrubberMonths: ScrubberMonth[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  limitedScroll = $derived(this.maxScrollPercent < 0.5);
  initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
      if (this.#options.albumId || this.#options.personId) {
        return;
      }
      this.connect();
    },
    () => {
      this.disconnect();
      this.isInitialized = false;
    },
    () => void 0,
  );

  static #INIT_OPTIONS = {};
  #websocketSupport: WebsocketSupport | undefined;
  #options: TimelineManagerOptions = TimelineManager.#INIT_OPTIONS;

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
    this.disconnect();
    super.destroy();
  }

  async updateOptions(options: TimelineManagerOptions) {
    if (options.deferInit) {
      return;
    }
    if (this.#options !== TimelineManager.#INIT_OPTIONS && isEqual(this.#options, options)) {
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

  connect() {
    if (this.#websocketSupport) {
      throw new Error('TimelineManager already connected');
    }
    this.#websocketSupport = new WebsocketSupport(this);
    this.#websocketSupport.connectWebsocketEvents();
  }

  disconnect() {
    if (!this.#websocketSupport) {
      return;
    }
    this.#websocketSupport.disconnectWebsocketEvents();
    this.#websocketSupport = undefined;
  }

  upsertAssets(assets: TimelineAsset[]) {
    const notUpdated = this.#updateAssets(assets);
    const notExcluded = notUpdated.filter((asset) => !this.isExcluded(asset));
    this.addAssetsToSegments(notExcluded);
  }

  async findMonthForAsset(id: string) {
    if (!this.isInitialized) {
      await this.initTask.waitUntilCompletion();
    }

    let { month } = findMonthForAssetUtil(this, id) ?? {};
    if (month) {
      return month;
    }

    const response = await getAssetInfo({ ...authManager.params, id }).catch(() => null);
    if (!response) {
      return;
    }

    const asset = toTimelineAsset(response);
    if (!asset || this.isExcluded(asset)) {
      return;
    }

    month = await this.#loadMonthAtTime(asset.localDateTime, { cancelable: false });
    if (month?.findAssetById({ id })) {
      return month;
    }
  }

  async loadSegment(identifier: SegmentIdentifier, options?: { cancelable: boolean }): Promise<void> {
    const { cancelable = true } = options ?? {};
    const segment = this.segments.find((segment) => identifier.matches(segment));
    if (!segment || segment.loader?.executed) {
      return;
    }

    await segment.load(cancelable);
  }

  async #loadMonthAtTime(yearMonth: TimelineYearMonth, options?: { cancelable: boolean }) {
    await this.loadSegment(getSegmentIdentifier(yearMonth), options);
    return getMonthByDate(this, yearMonth);
  }

  getMonthByAssetId(assetId: string) {
    const monthInfo = findMonthForAssetUtil(this, assetId);
    return monthInfo?.month;
  }

  // note: the `index` input is expected to be in the range [0, assetCount). This
  // value can be passed to make the method deterministic, which is mainly useful
  // for testing.
  async getRandomAsset(index?: number): Promise<TimelineAsset | undefined> {
    const randomAssetIndex = index ?? Math.floor(Math.random() * this.assetCount);

    let accumulatedCount = 0;

    let randomMonth: TimelineMonth | undefined = undefined;
    for (const month of this.segments) {
      if (randomAssetIndex < accumulatedCount + month.assetsCount) {
        randomMonth = month;
        break;
      }

      accumulatedCount += month.assetsCount;
    }
    if (!randomMonth) {
      return;
    }
    await this.loadSegment(getSegmentIdentifier(randomMonth.yearMonth), { cancelable: false });

    let randomDay: TimelineDay | undefined = undefined;
    for (const day of randomMonth.days) {
      if (randomAssetIndex < accumulatedCount + day.viewerAssets.length) {
        randomDay = day;
        break;
      }

      accumulatedCount += day.viewerAssets.length;
    }
    if (!randomDay) {
      return;
    }

    return randomDay.viewerAssets[randomAssetIndex - accumulatedCount].asset;
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

  removeAssets(ids: string[]) {
    this.#runAssetOperation(ids, () => ({ remove: true }));
  }

  protected createUpsertContext(): GroupInsertionCache {
    return new GroupInsertionCache();
  }

  protected upsertAssetIntoSegment(asset: TimelineAsset, context: GroupInsertionCache): void {
    let month = getMonthByDate(this, asset.localDateTime);

    if (!month) {
      month = new TimelineMonth(this, asset.localDateTime, 1, true, this.#options.order);
      this.segments.push(month);
    }

    month.addTimelineAsset(asset, context);
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

  #runAssetOperation(ids: string[], operation: AssetOperation) {
    if (ids.length === 0) {
      // eslint-disable-next-line svelte/prefer-svelte-reactivity
      return { processedIds: new Set<string>(), unprocessedIds: new Set<string>(), changedGeometry: false };
    }

    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const changedMonths = new Set<TimelineMonth>();
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

  isExcluded(asset: TimelineAsset) {
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

  async getLaterAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await getAssetWithOffset(this, assetDescriptor, interval, 'later');
  }

  async getEarlierAsset(
    assetDescriptor: AssetDescriptor,
    interval: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await getAssetWithOffset(this, assetDescriptor, interval, 'earlier');
  }

  async getClosestAssetToDate(dateTime: TimelineDateTime) {
    let month = findMonthForDate(this, dateTime);
    if (!month) {
      month = findClosestGroupForDate(this.segments, dateTime);
      if (!month) {
        return;
      }
    }
    await this.loadSegment(getSegmentIdentifier(dateTime), { cancelable: false });
    const asset = month.findClosest(dateTime);
    if (asset) {
      return asset;
    }
    for await (const asset of this.assetsIterator({ startMonth: month })) {
      return asset;
    }
  }

  async retrieveRange(start: AssetDescriptor, end: AssetDescriptor) {
    return retrieveRangeUtil(this, start, end);
  }

  clearDeferredLayout(month: TimelineMonth) {
    const hasDeferred = month.days.some((group) => group.deferredLayout);
    if (hasDeferred) {
      month.updateGeometry({ invalidateHeight: true, noDefer: true });
      for (const group of month.days) {
        group.deferredLayout = false;
      }
    }
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

  protected postCreateSegments(): void {
    this.segments.sort((a, b) => {
      return a.yearMonth.year === b.yearMonth.year
        ? b.yearMonth.month - a.yearMonth.month
        : b.yearMonth.year - a.yearMonth.year;
    });
  }

  protected postUpsert(context: GroupInsertionCache): void {
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
}
