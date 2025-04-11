import { locale } from '$lib/stores/preferences.store';
import { getKey } from '$lib/utils';
import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  getJustifiedLayoutFromAssets,
  getPosition,
  type CommonLayoutOptions,
  type CommonPosition,
} from '$lib/utils/layout-utils';
import { formatDateGroupTitle, fromLocalDateTime } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import {
  AssetOrder,
  getAssetInfo,
  getTimeBucket,
  getTimeBuckets,
  TimeBucketSize,
  type AssetResponseDto,
} from '@immich/sdk';
import { clamp, debounce, isEqual, throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';

import { SvelteSet } from 'svelte/reactivity';
import { get, writable, type Unsubscriber } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketEvents } from './websocket';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

type AssetApiGetTimeBucketsRequest = Parameters<typeof getTimeBuckets>[0];
export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'> & {
  timelineAlbumId?: string;
  deferInit?: boolean;
};
export type AssetStoreLayoutOptions = {
  rowHeight: number;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateObject(target: any, source: any): boolean {
  if (!target) {
    return false;
  }
  let updated = false;
  for (const key in source) {
    // eslint-disable-next-line no-prototype-builtins
    if (!source.hasOwnProperty(key)) {
      continue;
    }
    if (typeof target[key] === 'object') {
      updated = updated || updateObject(target[key], source[key]);
    } else {
      // Otherwise, directly copy the value
      if (target[key] !== source[key]) {
        target[key] = source[key];
        updated = true;
      }
    }
  }
  return updated;
}

export function assetSnapshot(asset: AssetResponseDto) {
  return $state.snapshot(asset);
}

export function assetsSnapshot(assets: AssetResponseDto[]) {
  return assets.map((a) => $state.snapshot(a));
}
class IntersectingAsset {
  // --- public ---
  readonly #group: AssetDateGroup;

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#group.bucket.store;
    const topWindow = store.visibleWindow.top - store.headerHeight - INTERSECTION_EXPAND_TOP;
    const bottomWindow = store.visibleWindow.bottom + store.headerHeight + INTERSECTION_EXPAND_BOTTOM;
    const positionTop = this.#group.absoluteDateGroupTop + this.position.top;
    const positionBottom = positionTop + this.position.height;

    const intersecting =
      (positionTop >= topWindow && positionTop < bottomWindow) ||
      (positionBottom >= topWindow && positionBottom < bottomWindow) ||
      (positionTop < topWindow && positionBottom >= bottomWindow);
    return intersecting;
  });

  position: CommonPosition | undefined = $state();
  asset: AssetResponseDto | undefined = $state();
  id: string | undefined = $derived(this.asset?.id);

  constructor(group: AssetDateGroup, asset: AssetResponseDto) {
    this.#group = group;
    this.asset = asset;
  }
}
type AssetOperation = (asset: AssetResponseDto) => { remove: boolean };

type MoveAsset = { asset: AssetResponseDto; year: number; month: number };
export class AssetDateGroup {
  // --- public
  readonly bucket: AssetBucket;
  readonly index: number;
  readonly date: DateTime;
  readonly dayOfMonth: number;
  intersetingAssets: IntersectingAsset[] = $state([]);
  dodo: IntersectingAsset[] = $state([]);

  height = $state(0);
  width = $state(0);
  intersecting = $derived.by(() => this.intersetingAssets.some((asset) => asset.intersecting));

  // --- private
  top: number = $state(0);
  left: number = $state(0);
  row = $state(0);
  col = $state(0);

  constructor(bucket: AssetBucket, index: number, date: DateTime, dayOfMonth: number) {
    this.index = index;
    this.bucket = bucket;
    this.date = date;
    this.dayOfMonth = dayOfMonth;
  }

  sortAssets(sortOrder: AssetOrder = AssetOrder.Desc) {
    this.intersetingAssets.sort((a, b) => {
      const aDate = DateTime.fromISO(a.asset!.fileCreatedAt).toUTC();
      const bDate = DateTime.fromISO(b.asset!.fileCreatedAt).toUTC();

      if (sortOrder === AssetOrder.Asc) {
        return aDate.diff(bDate).milliseconds;
      }

      return bDate.diff(aDate).milliseconds;
    });
  }

  getFirstAsset() {
    return this.intersetingAssets[0]?.asset;
  }
  getRandomAsset() {
    const random = Math.floor(Math.random() * this.intersetingAssets.length);
    return this.intersetingAssets[random];
  }

  getAssets() {
    return this.intersetingAssets.map((intersetingAsset) => intersetingAsset.asset!);
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as MoveAsset[],
        processedIds: new Set<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const unprocessedIds = new Set<string>(ids);
    const processedIds = new Set<string>();
    const moveAssets: MoveAsset[] = [];
    let changedGeometry = false;
    for (const assetId of unprocessedIds) {
      const index = this.intersetingAssets.findIndex((ia) => ia.id == assetId);
      if (index !== -1) {
        const asset = this.intersetingAssets[index].asset!;
        const oldTime = asset.localDateTime;
        let { remove } = operation(asset);
        const newTime = asset.localDateTime;
        if (oldTime !== newTime) {
          const utc = DateTime.fromISO(asset.localDateTime).toUTC().startOf('month');
          const year = utc.get('year');
          const month = utc.get('month');
          if (this.bucket.year !== year || this.bucket.month !== month) {
            remove = true;
            moveAssets.push({ asset, year, month });
          }
        }
        unprocessedIds.delete(assetId);
        processedIds.add(assetId);
        if (remove || this.bucket.store.isExcluded(asset)) {
          this.intersetingAssets.splice(index, 1);
          changedGeometry = true;
        }
      }
    }
    return { moveAssets, processedIds, unprocessedIds, changedGeometry };
  }

  layout(options: CommonLayoutOptions) {
    const assets = this.intersetingAssets.map((intersetingAsset) => intersetingAsset.asset!);
    const geometry = getJustifiedLayoutFromAssets(assets, options);
    this.width = geometry.containerWidth;
    this.height = assets.length === 0 ? 0 : geometry.containerHeight;
    for (let i = 0; i < this.intersetingAssets.length; i++) {
      const position = getPosition(geometry, i);
      this.intersetingAssets[i].position = position;
    }
  }

  get absoluteDateGroupTop() {
    return this.bucket.top + this.top;
  }

  get groupTitle() {
    return formatDateGroupTitle(this.date);
  }
}

export interface Viewport {
  width: number;
  height: number;
}
export type ViewportXY = Viewport & {
  x: number;
  y: number;
};

export class AssetBucket {
  // --- public ---
  #intersecting: boolean = $state(false);
  actuallyIntersecting: boolean = $state(false);
  isLoaded: boolean = $state(false);
  dateGroups: AssetDateGroup[] = $state([]);
  readonly store: AssetStore;

  // --- private ---
  /**
   * The DOM height of the bucket in pixel
   * This value is first estimated by the number of asset and later is corrected as the user scroll
   * Do not derive this height, it is important for it to be updated at specific times, so that
   * calculateing a delta between estimated and actual (when measured) is correct.
   */
  #bucketHeight: number = $state(0);
  #top: number = $state(0);

  #initialCount: number = 0;
  #sortOrder: AssetOrder = AssetOrder.Desc;
  percent: number = $state(0);
  // --- should be private, but is used by AssetStore ---

  bucketCount: number = $derived(
    this.isLoaded
      ? this.dateGroups.reduce((accumulator, g) => accumulator + g.intersetingAssets.length, 0)
      : this.#initialCount,
  );
  loader: CancellableTask | undefined;
  isBucketHeightActual: boolean = $state(false);

  readonly bucketDateFormatted: string;
  readonly bucketDate: string;
  readonly month: number;
  readonly year: number;

  constructor(store: AssetStore, utcDate: DateTime, initialCount: number, order: AssetOrder = AssetOrder.Desc) {
    this.store = store;
    this.#initialCount = initialCount;
    this.#sortOrder = order;

    const year = utcDate.get('year');
    const month = utcDate.get('month');
    const bucketDateFormatted = utcDate.toJSDate().toLocaleString(get(locale), {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });
    this.bucketDate = utcDate.toISO()!.toString();
    this.bucketDateFormatted = bucketDateFormatted;
    this.month = month;
    this.year = year;

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
        this.dateGroups = [];
        this.isLoaded = false;
      },
      this.handleLoadError,
    );
  }
  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old !== newValue) {
      this.#intersecting = newValue;
      if (newValue) {
        void this.store.loadBucket(this.bucketDate);
      } else {
        this.cancel();
      }
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  get lastDateGroup() {
    return this.dateGroups.at(-1);
  }

  getFirstAsset() {
    return this.dateGroups[0]?.getFirstAsset();
  }

  getAssets() {
    // eslint-disable-next-line unicorn/no-array-reduce
    return this.dateGroups.reduce(
      (accumulator: AssetResponseDto[], g: AssetDateGroup) => accumulator.concat(g.getAssets()),
      [],
    );
  }

  containsAssetId(id: string) {
    for (const group of this.dateGroups) {
      const index = group.intersetingAssets.findIndex((a) => a.id == id);
      if (index !== -1) {
        return true;
      }
    }
    return false;
  }

  sortDateGroups() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.dateGroups.sort((a, b) => a.date.diff(b.date).milliseconds);
    }

    return this.dateGroups.sort((a, b) => b.date.diff(a.date).milliseconds);
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as MoveAsset[],
        processedIds: new Set<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const { dateGroups } = this;
    let combinedChangedGeometry = false;
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: MoveAsset[][] = [];
    let index = dateGroups.length;
    while (index--) {
      if (idsToProcess.size > 0) {
        const group = dateGroups[index];
        const { moveAssets, processedIds, changedGeometry } = group.runAssetOperation(ids, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        combinedChangedGeometry = combinedChangedGeometry || changedGeometry;
        if (group.intersetingAssets.length === 0) {
          dateGroups.splice(index, 1);
          combinedChangedGeometry = true;
        }
      }
    }
    return {
      moveAssets: combinedMoveAssets.flat(),
      unprocessedIds: idsToProcess,
      processedIds: idsProcessed,
      changedGeometry: combinedChangedGeometry,
    };
  }

  // note - if the assets are not part of this bucket, they will not be added
  addAssets(assets: AssetResponseDto[]) {
    const lookupCache: {
      [dayOfMonth: number]: AssetDateGroup;
    } = {};
    const unprocessedAssets: AssetResponseDto[] = [];
    const changedDateGroups = new Set<AssetDateGroup>();
    const newDateGroups = new Set<AssetDateGroup>();
    for (const asset of assets) {
      const date = DateTime.fromISO(asset.localDateTime).toUTC();
      const month = date.get('month');
      const year = date.get('year');
      if (this.month === month && this.year === year) {
        const day = date.get('day');
        let dateGroup: AssetDateGroup | undefined = lookupCache[day];
        if (!dateGroup) {
          dateGroup = this.findDateGroupByDay(day);
          if (dateGroup) {
            lookupCache[day] = dateGroup;
          }
        }
        if (dateGroup) {
          const intersectingAsset = new IntersectingAsset(dateGroup, asset);
          if (dateGroup.intersetingAssets.some((a) => a.id === asset.id)) {
            console.error(`Ignoring attempt to add duplicate asset ${asset.id} to ${dateGroup.groupTitle}`);
          } else {
            dateGroup.intersetingAssets.push(intersectingAsset);
            changedDateGroups.add(dateGroup);
          }
        } else {
          dateGroup = new AssetDateGroup(this, this.dateGroups.length, date, day);
          dateGroup.intersetingAssets.push(new IntersectingAsset(dateGroup, asset));
          this.dateGroups.push(dateGroup);
          lookupCache[day] = dateGroup;
          newDateGroups.add(dateGroup);
        }
      } else {
        unprocessedAssets.push(asset);
      }
    }
    for (const group of changedDateGroups) {
      group.sortAssets(this.#sortOrder);
    }
    for (const group of newDateGroups) {
      group.sortAssets(this.#sortOrder);
    }
    if (newDateGroups.size > 0) {
      this.sortDateGroups();
    }
    return unprocessedAssets;
  }
  getRandomDateGroup() {
    const random = Math.floor(Math.random() * this.dateGroups.length);
    return this.dateGroups[random];
  }

  getRandomAsset() {
    return this.getRandomDateGroup()?.getRandomAsset()?.asset;
  }

  /** The svelte key for this view model object */
  get viewId() {
    return this.bucketDate;
  }

  set bucketHeight(height: number) {
    const { store, percent } = this;
    const index = store.buckets.indexOf(this);
    const bucketHeightDelta = height - this.#bucketHeight;
    this.#bucketHeight = height;
    const prevBucket = store.buckets[index - 1];
    if (prevBucket) {
      const newTop = prevBucket.#top + prevBucket.#bucketHeight;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    for (let cursor = index + 1; cursor < store.buckets.length; cursor++) {
      const bucket = this.store.buckets[cursor];
      const newTop = bucket.#top + bucketHeightDelta;
      if (bucket.#top !== newTop) {
        bucket.#top = newTop;
      }
    }
    if (store.topIntersectingBucket) {
      const currentIndex = store.buckets.indexOf(store.topIntersectingBucket);
      // if the bucket is 'before' the last intersecting bucket in the sliding window
      // then adjust the scroll position by the delta, to compensate for the bucket
      // size adjustment
      if (currentIndex > 0) {
        if (index < currentIndex) {
          store.compensateScrollCallback?.({ delta: bucketHeightDelta });
        } else if (currentIndex == currentIndex && percent > 0) {
          const top = this.top + height * percent;
          store.compensateScrollCallback?.({ top });
        }
      }
    }
  }
  get bucketHeight() {
    return this.#bucketHeight;
  }

  get top(): number {
    return this.#top + this.store.topSectionHeight;
  }

  handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  findDateGroupByDay(dayOfMonth: number) {
    return this.dateGroups.find((group) => group.dayOfMonth === dayOfMonth);
  }

  findAssetAbsolutePosition(assetId: string) {
    for (const group of this.dateGroups) {
      const intersectingAsset = group.intersetingAssets.find((asset) => asset.id === assetId);
      if (intersectingAsset) {
        return this.top + group.top + intersectingAsset.position!.top + this.store.headerHeight;
      }
    }
    return -1;
  }

  cancel() {
    this.loader?.cancel();
  }
}

const isMismatched = (option: boolean | undefined, value: boolean): boolean =>
  option === undefined ? false : option !== value;

interface AddAsset {
  type: 'add';
  values: AssetResponseDto[];
}

interface UpdateAsset {
  type: 'update';
  values: AssetResponseDto[];
}

interface DeleteAsset {
  type: 'delete';
  values: string[];
}

interface TrashAssets {
  type: 'trash';
  values: string[];
}
interface UpdateStackAssets {
  type: 'update_stack_assets';
  values: string[];
}

export const photoViewerImgElement = writable<HTMLImageElement | null>(null);

type PendingChange = AddAsset | UpdateAsset | DeleteAsset | TrashAssets | UpdateStackAssets;

export type LiteBucket = {
  bucketHeight: number;
  assetCount: number;
  bucketDate: string;
  bucketDateFormattted: string;
};

export class AssetStore {
  // --- public ----
  isInitialized = $state(false);
  buckets: AssetBucket[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(
    this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0) + this.topSectionHeight,
  );

  // todo - name this better
  albumAssets: Set<string> = new SvelteSet();

  // -- for scrubber only
  scrubberBuckets: LiteBucket[] = $state([]);
  scrubberTimelineHeight: number = $state(0);

  // -- should be private, but used by AssetBucket
  compensateScrollCallback: (({ delta, top }: { delta?: number; top?: number }) => void) | undefined;
  topIntersectingBucket: AssetBucket | undefined = $state();

  visibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));

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

  // --- private
  static #INIT_OPTIONS = {};
  #viewportHeight = $state(0);
  #viewportWidth = $state(0);
  #scrollTop = $state(0);
  #pendingChanges: PendingChange[] = [];
  #unsubscribers: Unsubscriber[] = [];

  #rowHeight = $state(235);
  #headerHeight = $state(49);
  #gap = $state(12);

  #options: AssetStoreOptions = AssetStore.#INIT_OPTIONS;

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);

  constructor() {}

  set headerHeight(value) {
    if (this.#headerHeight == value) {
      return;
    }
    this.#headerHeight = value;
    this.refreshLayout();
  }

  get headerHeight() {
    return this.#headerHeight;
  }

  set gap(value) {
    if (this.#gap == value) {
      return;
    }
    this.#gap = value;
    this.refreshLayout();
  }

  get gap() {
    return this.#gap;
  }

  set rowHeight(value) {
    if (this.#rowHeight == value) {
      return;
    }
    this.#rowHeight = value;
    this.refreshLayout();
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
    // side-effect - its ok!
    void this.#updateViewportGeometry(changed);
  }

  get viewportWidth() {
    return this.#viewportWidth;
  }

  set viewportHeight(value: number) {
    this.#viewportHeight = value;
    this.#suspendTransitions = true;
    // side-effect - its ok!
    void this.#updateViewportGeometry(false);
  }

  get viewportHeight() {
    return this.#viewportHeight;
  }

  getAssets() {
    return this.buckets.flatMap((bucket) => bucket.getAssets());
  }

  #addPendingChanges(...changes: PendingChange[]) {
    this.#pendingChanges.push(...changes);
    this.#processPendingChanges();
  }

  connect() {
    this.#unsubscribers.push(
      websocketEvents.on('on_upload_success', (asset) => this.#addPendingChanges({ type: 'add', values: [asset] })),
      websocketEvents.on('on_asset_trash', (ids) => this.#addPendingChanges({ type: 'trash', values: ids })),
      websocketEvents.on('on_asset_update', (asset) => this.#addPendingChanges({ type: 'update', values: [asset] })),
      websocketEvents.on('on_asset_delete', (id: string) => this.#addPendingChanges({ type: 'delete', values: [id] })),
    );
  }

  disconnect() {
    for (const unsubscribe of this.#unsubscribers) {
      unsubscribe();
    }
    this.#unsubscribers = [];
  }

  #getPendingChangeBatches() {
    const batch: {
      add: AssetResponseDto[];
      update: AssetResponseDto[];
      remove: string[];
    } = {
      add: [],
      update: [],
      remove: [],
    };
    for (const { type, values } of this.#pendingChanges) {
      switch (type) {
        case 'add': {
          batch.add.push(...values);

          break;
        }
        case 'update': {
          batch.update.push(...values);

          break;
        }
        case 'delete':
        case 'trash': {
          batch.remove.push(...values);

          break;
        }
        // No default
      }
    }
    return batch;
  }

  // todo: this should probably be a method isteat
  #findBucketForAsset(id: string) {
    for (const bucket of this.buckets) {
      if (bucket.containsAssetId(id)) {
        return bucket;
      }
    }
  }

  updateSlidingWindow(scrollTop: number) {
    this.#scrollTop = scrollTop;
    this.updateIntersections();
  }

  updateIntersections() {
    if (!this.isInitialized || this.visibleWindow.bottom === this.visibleWindow.top) {
      return;
    }
    let topIntersectingBucket = undefined;
    for (const bucket of this.buckets) {
      this.#updateIntersection(bucket);
      if (!topIntersectingBucket && bucket.actuallyIntersecting && bucket.isLoaded) {
        topIntersectingBucket = bucket;
      }
    }
    if (this.topIntersectingBucket !== topIntersectingBucket) {
      this.topIntersectingBucket = topIntersectingBucket;
    }
    for (const bucket of this.buckets) {
      if (bucket === this.topIntersectingBucket) {
        this.topIntersectingBucket.percent = clamp(
          (this.visibleWindow.top - this.topIntersectingBucket.top) / this.topIntersectingBucket.bucketHeight,
          0,
          1,
        );
      } else {
        bucket.percent = 0;
      }
    }
  }

  #calculateIntersecting(bucket: AssetBucket, expandTop: number, expandBottom: number) {
    const bucketTop = bucket.top;
    const bucketBottom = bucketTop + bucket.bucketHeight;
    const topWindow = this.visibleWindow.top - expandTop;
    const bottomWindow = this.visibleWindow.bottom + expandBottom;

    // a bucket intersections if
    // 1) bucket's bottom is in the visible range -or-
    // 2) bucket's bottom is in the visible range -or-
    // 3) bucket's top is above visible range and bottom is below visible range
    return (
      (bucketTop >= topWindow && bucketTop < bottomWindow) ||
      (bucketBottom >= topWindow && bucketBottom < bottomWindow) ||
      (bucketTop < topWindow && bucketBottom >= bottomWindow)
    );
  }

  #updateIntersection(bucket: AssetBucket) {
    const actuallyIntersecting = this.#calculateIntersecting(bucket, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.#calculateIntersecting(bucket, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    bucket.intersecting = actuallyIntersecting || preIntersecting;
    bucket.actuallyIntersecting = actuallyIntersecting;
  }

  #processPendingChanges = throttle(() => {
    const { add, update, remove } = this.#getPendingChangeBatches();
    if (add.length > 0) {
      this.addAssets(add);
    }
    if (update.length > 0) {
      this.updateAssets(update);
    }
    if (remove.length > 0) {
      this.removeAssets(remove);
    }
    this.#pendingChanges = [];
  }, 2500);

  setCompensateScrollCallback(compensateScrollCallback?: ({ delta, top }: { delta?: number; top?: number }) => void) {
    this.compensateScrollCallback = compensateScrollCallback;
  }

  async #initialiazeTimeBuckets() {
    const timebuckets = await getTimeBuckets({
      ...this.#options,
      size: TimeBucketSize.Month,
      key: getKey(),
    });

    this.buckets = timebuckets.map((bucket) => {
      const utcDate = DateTime.fromISO(bucket.timeBucket).toUTC();
      return new AssetBucket(this, utcDate, bucket.count, this.#options.order);
    });
    this.albumAssets.clear();
    this.#updateViewportGeometry(false);
  }

  /**
   * If the timeline query options change (i.e. albumId, isArchived, isFavorite, etc)
   * call this method to recreate all buckets based on the new options.
   *
   * @param options The query options for time bucket queries.
   */
  async updateOptions(options: AssetStoreOptions) {
    if (options.deferInit) {
      return;
    }
    if (this.#options !== AssetStore.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
    this.#updateViewportGeometry(false);
  }

  async #init(options: AssetStoreOptions) {
    // doing the following outside of the task reduces flickr
    this.isInitialized = false;
    this.buckets = [];
    this.albumAssets.clear();
    await this.initTask.execute(async () => {
      this.#options = options;
      await this.#initialiazeTimeBuckets();
    }, true);
  }
  public destroy() {
    this.disconnect();
    this.isInitialized = false;
  }

  async updateViewport(viewport: Viewport) {
    if (viewport.height === 0 && viewport.width === 0) {
      return;
    }

    if (this.viewportHeight === viewport.height && this.viewportWidth === viewport.width) {
      return;
    }

    // special case updateViewport before or soon after call to updateOptions
    if (!this.initTask.executed) {
      // eslint-disable-next-line unicorn/prefer-ternary
      if (this.initTask.loading) {
        await this.initTask.waitUntilCompletion();
      } else {
        // not executed and not loaded means we should init now, and init will
        // also update geometry so just return after
        await this.#init(this.#options);
      }
    }

    // changing width affects the actual height, and needs to re-layout
    const changedWidth = viewport.width !== this.viewportWidth;
    this.viewportHeight = viewport.height;
    this.viewportWidth = viewport.width;
    this.#updateViewportGeometry(changedWidth);
  }

  #updateViewportGeometry(changedWidth: boolean) {
    if (!this.isInitialized) {
      return;
    }
    if (this.viewportWidth === 0 || this.viewportHeight === 0) {
      return;
    }
    for (const bucket of this.buckets) {
      this.#updateGeometry(bucket, changedWidth);
    }
    this.updateIntersections();
    this.#createScrubBuckets();
  }

  #createScrubBuckets() {
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      bucketDate: bucket.bucketDate,
      bucketDateFormattted: bucket.bucketDateFormatted,
      bucketHeight: bucket.bucketHeight,
    }));
    this.scrubberTimelineHeight = this.timelineHeight;
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
  #updateGeometry(bucket: AssetBucket, invalidateHeight: boolean) {
    if (invalidateHeight) {
      bucket.isBucketHeightActual = false;
    }
    if (!bucket.isLoaded) {
      // optimize - if bucket already has data, no need to create estimates
      const viewportWidth = this.viewportWidth;
      if (!bucket.isBucketHeightActual) {
        const unwrappedWidth = (3 / 2) * bucket.bucketCount * this.#rowHeight * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * this.#rowHeight;
        bucket.bucketHeight = height;
      }
      return;
    }
    this.#layoutBucket(bucket);
  }

  #layoutBucket(bucket: AssetBucket) {
    // these are top offsets, for each row
    let cummulativeHeight = 0;
    // these are left offsets of each group, for each row
    let cummulativeWidth = 0;
    let lastRowHeight = 0;
    let lastRow = 0;

    let dateGroupRow = 0;
    let dateGroupCol = 0;

    const rowSpaceRemaining: number[] = Array.from({ length: bucket.dateGroups.length });
    rowSpaceRemaining.fill(this.viewportWidth, 0, bucket.dateGroups.length);
    const options = this.createLayoutOptions();
    for (const assetGroup of bucket.dateGroups) {
      assetGroup.layout(options);
      rowSpaceRemaining[dateGroupRow] -= assetGroup.width - 1;
      if (dateGroupCol > 0) {
        rowSpaceRemaining[dateGroupRow] -= this.gap;
      }
      if (rowSpaceRemaining[dateGroupRow] >= 0) {
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;
        assetGroup.top = cummulativeHeight;

        dateGroupCol++;

        cummulativeWidth += assetGroup.width + this.gap;
      } else {
        // starting a new row, we need to update the last col of the previous row
        cummulativeWidth = 0;
        dateGroupRow++;
        dateGroupCol = 0;
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;

        rowSpaceRemaining[dateGroupRow] -= assetGroup.width;
        dateGroupCol++;
        cummulativeHeight += lastRowHeight;
        assetGroup.top = cummulativeHeight;
        cummulativeWidth += assetGroup.width + this.gap;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.height + this.headerHeight;
    }
    if (lastRow === 0 || lastRow !== bucket.lastDateGroup?.row) {
      cummulativeHeight += lastRowHeight;
    }

    bucket.bucketHeight = cummulativeHeight;
    bucket.isBucketHeightActual = true;
  }

  async loadBucket(bucketDate: string, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }

    const date = DateTime.fromISO(bucketDate).toUTC();
    const year = date.get('year');
    const month = date.get('month');
    const bucket = this.getBucketByDate(year, month);
    if (!bucket) {
      return;
    }

    if (bucket.loader?.executed) {
      return;
    }

    const result = await bucket.loader?.execute(async (signal: AbortSignal) => {
      if (bucket.getFirstAsset()) {
        // this happens when a bucket was created by an event instead of via a loadBucket call
        // so no need to load the bucket, it already has assets
        return;
      }
      const assets = await getTimeBucket(
        {
          ...this.#options,
          timeBucket: bucketDate,
          size: TimeBucketSize.Month,
          key: getKey(),
        },
        { signal },
      );
      if (assets) {
        if (this.#options.timelineAlbumId) {
          const albumAssets = await getTimeBucket(
            {
              albumId: this.#options.timelineAlbumId,
              timeBucket: bucketDate,
              size: TimeBucketSize.Month,
              key: getKey(),
            },
            { signal },
          );
          for (const asset of albumAssets) {
            this.albumAssets.add(asset.id);
          }
        }

        const unprocessed = bucket.addAssets(assets);
        if (unprocessed.length > 0) {
          console.error(
            `Warning: getTimeBucket API returning assets not in requested month: ${bucket.bucketDate}, ${JSON.stringify(unprocessed.map((a) => ({ id: a.id, localDateTime: a.localDateTime })))}`,
          );
        }
        this.#layoutBucket(bucket);
      }
    }, cancelable);
    if (result === 'LOADED') {
      this.#updateIntersection(bucket);
    }
  }

  addAssets(assets: AssetResponseDto[]) {
    const assetsToUpdate: AssetResponseDto[] = [];

    for (const asset of assets) {
      if (this.isExcluded(asset)) {
        continue;
      }
      assetsToUpdate.push(asset);
    }

    const notUpdated = this.updateAssets(assetsToUpdate);
    this.#addAssetsToBuckets([...notUpdated]);
  }

  #addAssetsToBuckets(assets: AssetResponseDto[]) {
    if (assets.length === 0) {
      return;
    }
    const updatedBuckets = new Set<AssetBucket>();
    const updatedDateGroups = new Set<AssetDateGroup>();

    for (const asset of assets) {
      const utc = DateTime.fromISO(asset.localDateTime).toUTC().startOf('month');
      const year = utc.get('year');
      const month = utc.get('month');
      let bucket = this.getBucketByDate(year, month);

      if (!bucket) {
        bucket = new AssetBucket(this, utc, 1, this.#options.order);
        this.buckets.push(bucket);
      }
      bucket.addAssets([asset]);
      updatedBuckets.add(bucket);
    }

    this.buckets.sort((a, b) => {
      return a.year === b.year ? b.month - a.month : b.year - a.year;
    });

    for (const dateGroup of updatedDateGroups) {
      dateGroup.sortAssets(this.#options.order);
    }
    for (const bucket of updatedBuckets) {
      bucket.sortDateGroups();
      this.#updateGeometry(bucket, true);
    }
    this.updateIntersections();
  }

  getBucketByDate(year: number, month: number): AssetBucket | undefined {
    return this.buckets.find((bucket) => bucket.year === year && bucket.month === month);
  }

  async findBucketForAsset(id: string) {
    await this.initTask.waitUntilCompletion();
    let bucket = this.#findBucketForAsset(id);
    if (!bucket) {
      const asset = await getAssetInfo({ id });
      if (!asset || this.isExcluded(asset)) {
        return;
      }
      bucket = await this.#loadBucketAtTime(asset.localDateTime, { cancelable: false });
    }

    if (bucket && bucket?.containsAssetId(id)) {
      return bucket;
    }
  }

  async #loadBucketAtTime(localDateTime: string, options?: { cancelable: boolean }) {
    let date = fromLocalDateTime(localDateTime);
    // Only support TimeBucketSize.Month
    date = date.set({ day: 1, hour: 0, minute: 0, second: 0, millisecond: 0 });
    const iso = date.toISO()!;
    const year = date.get('year');
    const month = date.get('month');
    await this.loadBucket(iso, options);
    return this.getBucketByDate(year, month);
  }

  async #getBucketInfoForAsset(asset: AssetResponseDto, options?: { cancelable: boolean }) {
    const bucketInfo = this.#findBucketForAsset(asset.id);
    if (bucketInfo) {
      return bucketInfo;
    }
    await this.#loadBucketAtTime(asset.localDateTime, options);
    return this.#findBucketForAsset(asset.id);
  }

  getBucketIndexByAssetId(assetId: string) {
    return this.#findBucketForAsset(assetId);
  }

  async getRandomBucket() {
    const random = Math.floor(Math.random() * this.buckets.length);
    const bucket = this.buckets[random];
    await this.loadBucket(bucket.bucketDate, { cancelable: false });
    return bucket;
  }

  async getRandomAsset() {
    const bucket = await this.getRandomBucket();
    return bucket?.getRandomAsset();
  }

  // runs op on assets, returns unprocessed
  #runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
    }

    const changedBuckets = new Set<AssetBucket>();
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: { asset: AssetResponseDto; year: number; month: number }[][] = [];
    for (const bucket of this.buckets) {
      if (idsToProcess.size > 0) {
        const { moveAssets, processedIds, changedGeometry } = bucket.runAssetOperation(idsToProcess, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedBuckets.add(bucket);
        }
      }
    }
    if (combinedMoveAssets.length > 0) {
      this.#addAssetsToBuckets(combinedMoveAssets.flat().map((a) => a.asset));
    }
    const changedGeometry = changedBuckets.size > 0;
    for (const bucket of changedBuckets) {
      this.#updateGeometry(bucket, true);
    }
    if (changedGeometry) {
      this.updateIntersections();
    }
    return { unprocessedIds: idsToProcess, processedIds: idsProcessed, changedGeometry };
  }

  /**
   * Runs a callback on a list of asset ids. The assets in the AssetStore are reactive -
   * any change to the asset (i.e. changing isFavorite, isArchived, etc) will automatically
   * cause the UI to update with no further actions needed. Changing the date of an asset
   * will automatically move it to another bucket if needed. Removing the asset will remove
   * it from any view that is showing it.
   *
   * @param ids to run the operation on
   * @param operation callback to update the specified asset ids
   */
  updateAssetOperation(ids: string[], operation: AssetOperation) {
    this.#runAssetOperation(new Set(ids), operation);
  }

  updateAssets(assets: AssetResponseDto[]) {
    const lookup = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, asset]));
    const { unprocessedIds } = this.#runAssetOperation(new Set(lookup.keys()), (asset) => {
      updateObject(asset, lookup.get(asset.id));
      return { remove: false };
    });
    return unprocessedIds.values().map((id) => lookup.get(id)!);
  }

  removeAssets(ids: string[]) {
    const { unprocessedIds } = this.#runAssetOperation(new Set(ids), () => {
      return { remove: true };
    });
    return [...unprocessedIds];
  }

  refreshLayout() {
    for (const bucket of this.buckets) {
      this.#updateGeometry(bucket, true);
    }
    this.updateIntersections();
  }

  getFirstAsset(): AssetResponseDto | undefined {
    return this.buckets[0]?.getFirstAsset();
  }

  async getPreviousAsset(asset: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    let bucket = await this.#getBucketInfoForAsset(asset);
    if (!bucket) {
      return;
    }

    // Find which date group contains this asset
    for (let groupIndex = 0; groupIndex < bucket.dateGroups.length; groupIndex++) {
      const group = bucket.dateGroups[groupIndex];
      const assetIndex = group.intersetingAssets.findIndex((ia) => ia.id === asset.id);

      if (assetIndex !== -1) {
        // If not the first asset in this group, return the previous one
        if (assetIndex > 0) {
          return group.intersetingAssets[assetIndex - 1].asset;
        }

        // If there are previous date groups in this bucket, check the previous one
        if (groupIndex > 0) {
          const prevGroup = bucket.dateGroups[groupIndex - 1];
          return prevGroup.intersetingAssets.at(-1)?.asset;
        }

        // Otherwise, we need to look in the previous bucket
        break;
      }
    }

    let bucketIndex = this.buckets.indexOf(bucket) - 1;
    while (bucketIndex >= 0) {
      bucket = this.buckets[bucketIndex];
      if (!bucket) {
        return;
      }
      await this.loadBucket(bucket.bucketDate);
      const previous = bucket.lastDateGroup?.intersetingAssets.at(-1)?.asset;
      if (previous) {
        return previous;
      }
      bucketIndex--;
    }
  }

  async getNextAsset(asset: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    let bucket = await this.#getBucketInfoForAsset(asset);
    if (!bucket) {
      return;
    }

    // Find which date group contains this asset
    for (let groupIndex = 0; groupIndex < bucket.dateGroups.length; groupIndex++) {
      const group = bucket.dateGroups[groupIndex];
      const assetIndex = group.intersetingAssets.findIndex((ia) => ia.id === asset.id);

      if (assetIndex !== -1) {
        // If not the last asset in this group, return the next one
        if (assetIndex < group.intersetingAssets.length - 1) {
          return group.intersetingAssets[assetIndex + 1].asset;
        }

        // If there are more date groups in this bucket, check the next one
        if (groupIndex < bucket.dateGroups.length - 1) {
          return bucket.dateGroups[groupIndex + 1].intersetingAssets[0]?.asset;
        }

        // Otherwise, we need to look in the next bucket
        break;
      }
    }

    let bucketIndex = this.buckets.indexOf(bucket) + 1;
    while (bucketIndex < this.buckets.length) {
      bucket = this.buckets[bucketIndex];
      await this.loadBucket(bucket.bucketDate);
      const next = bucket.dateGroups[0]?.intersetingAssets[0]?.asset;
      if (next) {
        return next;
      }
      bucketIndex++;
    }
  }

  isExcluded(asset: AssetResponseDto) {
    return (
      isMismatched(this.#options.isArchived, asset.isArchived) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed, asset.isTrashed)
    );
  }
}

export const isSelectingAllAssets = writable(false);
