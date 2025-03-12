import { locale } from '$lib/stores/preferences.store';
import { getKey } from '$lib/utils';
import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  getJustifiedLayoutFromAssets,
  getPosition,
  type CommonLayoutOptions,
  type CommonPosition,
} from '$lib/utils/layout-utils';
import { formatDateGroupTitle, fromLocalDateTime, groupDateFormat } from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import { getAssetInfo, getTimeBucket, getTimeBuckets, TimeBucketSize, type AssetResponseDto } from '@immich/sdk';
import { debounce, isEqual, throttle } from 'lodash-es';
import { DateTime } from 'luxon';
import { t } from 'svelte-i18n';

import { SvelteSet } from 'svelte/reactivity';
import { get, writable, type Unsubscriber } from 'svelte/store';
import { handleError } from '../utils/handle-error';
import { websocketEvents } from './websocket';

const {
  TIMELINE: { INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM },
} = TUNABLES;

const THUMBNAIL_HEIGHT = 235;
const GAP = 12;
const HEADER = 49; //(1.5rem)

type AssetApiGetTimeBucketsRequest = Parameters<typeof getTimeBuckets>[0];
export type AssetStoreOptions = Omit<AssetApiGetTimeBucketsRequest, 'size'> & {
  timelineAlbumId?: string;
  deferInit?: boolean;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function updateObject(target: any, source: any): boolean {
  let updated = false;
  for (const key in source) {
    if (typeof source[key] === 'object' && source[key] !== null) {
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

class IntersectingAsset {
  // --- public ---
  readonly #group: AssetDateGroup;

  // intersecting = $state(false);

  intersecting = $derived.by(() => {
    if (!this.position) {
      return false;
    }

    const store = this.#group.bucket.store;
    const topWindow = store.visibleWindow.top - HEADER - INTERSECTION_EXPAND_TOP;
    const bottomWindow = store.visibleWindow.bottom - HEADER + INTERSECTION_EXPAND_BOTTOM;
    const positionTop = this.#group.absoluteDateGroupTop + this.position.top;
    const positionBottom = positionTop + this.position.height;
    const intersecting = positionBottom > topWindow && this.position.top < bottomWindow;
    return intersecting;
  });

  position: CommonPosition | undefined = $state();
  asset: AssetResponseDto | undefined = $state();
  id: string = $derived.by(() => this.asset!.id);

  constructor(group: AssetDateGroup, asset: AssetResponseDto) {
    this.#group = group;
    this.asset = asset;
    // setInterval(() => {
    //   const a = { ...this.position };
    //   a.top = a.top + 1;
    //   this.position = a;
    // }, 2000);
  }
}
type AssetOperation = (asset: AssetResponseDto) => { remove: boolean };

export class AssetDateGroup {
  // --- public
  readonly bucket: AssetBucket;
  readonly index: number;
  readonly date: DateTime;
  readonly dateString: string;
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

  constructor(bucket: AssetBucket, index: number, date: DateTime, dateString: string) {
    this.index = index;
    this.bucket = bucket;
    this.date = date;
    this.dateString = dateString;
  }

  sortAssets() {
    this.intersetingAssets.sort((a, b) => {
      const aDate = DateTime.fromISO(a.asset!.fileCreatedAt).toUTC();
      const bDate = DateTime.fromISO(b.asset!.fileCreatedAt).toUTC();
      return bDate.diff(aDate).milliseconds;
    });
  }

  getRandomAsset() {
    const random = Math.floor(Math.random() * this.intersetingAssets.length);
    return this.intersetingAssets[random];
  }

  getAssets() {
    return this.intersetingAssets.map((intersetingAsset) => intersetingAsset.asset!);
  }

  runAssetOp(ids: Set<string>, op: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set<string>(), unprocessedIds: ids, changedGeometry: false };
    }
    const unprocessedIds = new Set<string>(ids);
    const processedIds = new Set<string>();
    let changedGeometry = false;
    for (const assetId of unprocessedIds) {
      const index = this.intersetingAssets.findIndex((ia) => ia.id == assetId);
      if (index !== -1) {
        const old = this.intersetingAssets[index].asset!;
        const { remove } = op(old);
        unprocessedIds.delete(assetId);
        processedIds.add(assetId);
        if (remove || this.bucket.store.isExcluded(old)) {
          this.intersetingAssets.splice(index, 1);
          changedGeometry = true;
        }
      }
    }
    return { processedIds, unprocessedIds, changedGeometry };
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

  // --- should be private, but is used by AssetStore ---

  bucketCount: number = $derived(
    this.isLoaded
      ? this.dateGroups.reduce((accumulator, g) => accumulator + g.intersetingAssets.length, 0)
      : this.#initialCount,
  );
  loader: CancellableTask | undefined;
  isBucketHeightActual: boolean = $state(false);
  readonly utcDate: DateTime;
  readonly bucketDateFormatted: string;
  readonly bucketDate: string;

  constructor(store: AssetStore, utcDate: DateTime, bucketDate: string, initialCount: number) {
    this.store = store;
    this.#initialCount = initialCount;
    this.utcDate = utcDate;
    this.bucketDate = bucketDate;
    this.bucketDateFormatted = utcDate.toJSDate().toLocaleString(get(locale), {
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC',
    });

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
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
    this.dateGroups.sort((a, b) => b.date.diff(a.date).milliseconds);
  }

  runAssetOp(ids: Set<string>, op: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set<string>(), unprocessedIds: ids, changedGeometry: false };
    }
    const { dateGroups } = this;
    let combinedChangedGeometry = false;
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    let index = dateGroups.length;
    while (index--) {
      if (idsToProcess.size > 0) {
        const group = dateGroups[index];
        const { processedIds, changedGeometry } = group.runAssetOp(ids, op);
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
    return { unprocessedIds: idsToProcess, processedIds: idsProcessed, changedGeometry: combinedChangedGeometry };
  }

  addAssets(assets: AssetResponseDto[], locale: string | undefined) {
    const lookupCache: {
      [groupDate: string]: AssetDateGroup;
    } = {};

    for (const asset of assets) {
      const date = fromLocalDateTime(asset.localDateTime);
      const group = date.toLocaleString(groupDateFormat, { locale });

      let dateGroup: AssetDateGroup | undefined = lookupCache[group];
      if (!dateGroup) {
        dateGroup = this.findDateGroupByDate(group);
        if (dateGroup) {
          lookupCache[group] = dateGroup;
        }
      }
      if (dateGroup) {
        const intersectingAsset = new IntersectingAsset(dateGroup, asset);
        dateGroup.intersetingAssets.push(intersectingAsset);
      } else {
        dateGroup = new AssetDateGroup(this, this.dateGroups.length, date, group);
        dateGroup.intersetingAssets.push(new IntersectingAsset(dateGroup, asset));
        this.dateGroups.push(dateGroup);
        lookupCache[group] = dateGroup;
      }
    }
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
    const { store } = this;
    const index = store.buckets.indexOf(this);
    const bucketHeightDelta = height - this.#bucketHeight;
    const prevBucket = store.buckets[index - 1];
    if (prevBucket) {
      this.#top = prevBucket.#top + prevBucket.#bucketHeight;
    }
    if (bucketHeightDelta) {
      let cursor = index + 1;
      while (cursor < store.buckets.length) {
        const nextBucket = this.store.buckets[cursor];
        nextBucket.#top += bucketHeightDelta;
        cursor++;
      }
    }
    this.#bucketHeight = height;
    if (store.topIntersectingBucket) {
      const currentIndex = store.buckets.indexOf(store.topIntersectingBucket);
      // if the bucket is 'before' the last intersecting bucket in the sliding window
      // then adjust the scroll position by the delta, to compensate for the bucket
      // size adjustment

      if (INTERSECTION_EXPAND_TOP > 0) {
        // we use < or = because the topIntersectingBucket is actually slightly expanded
        // because of INTERSECTION_EXPAND_TOP
        if (index <= currentIndex) {
          store.compensateScrollCallback?.(bucketHeightDelta);
        }
      } else {
        if (index < currentIndex) {
          store.compensateScrollCallback?.(bucketHeightDelta);
        }
      }
    }
  }
  get bucketHeight() {
    return this.#bucketHeight;
  }

  set top(top: number) {
    this.#top = top;
  }
  get top() {
    return this.#top + this.store.topSectionHeight;
  }

  handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  findDateGroupByDate(dateString: string) {
    return this.dateGroups.find((group) => group.dateString === dateString);
  }

  findAssetAbsolutePosition(assetId: string) {
    for (const group of this.dateGroups) {
      const intersectingAsset = group.intersetingAssets.find((asset) => asset.id === assetId);
      if (intersectingAsset) {
        return this.top + group.top + intersectingAsset.position!.top + HEADER;
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
  scrubberTimelineHieght: number = $state(0);

  // -- should be private, but used by AssetBucket
  compensateScrollCallback: ((delta: number) => void) | undefined;
  topIntersectingBucket: AssetBucket | undefined = $state();

  visibleWindow = $derived.by(() => ({
    top: this.#scrollTop,
    bottom: this.#scrollTop + this.viewportHeight,
  }));

  initTask = new CancellableTask(
    () => {
      this.isInitialized = true;
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

  #options: AssetStoreOptions = AssetStore.#INIT_OPTIONS;

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);

  constructor() {}

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
      if (!topIntersectingBucket && bucket.intersecting) {
        topIntersectingBucket = bucket;
      }
    }
    this.topIntersectingBucket = topIntersectingBucket;
  }

  #updateIntersection(bucket: AssetBucket) {
    const bucketTop = bucket.top;
    const bucketBottom = bucketTop + bucket.bucketHeight;
    const topWindow = this.visibleWindow.top - HEADER - INTERSECTION_EXPAND_TOP;
    const bottomWindow = this.visibleWindow.bottom - HEADER + INTERSECTION_EXPAND_BOTTOM;
    bucket.intersecting = bucketTop < bottomWindow && bucketBottom > topWindow ? true : false;
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

  setCompensateScrollCallback(compensateScrollCallback?: (delta: number) => void) {
    this.compensateScrollCallback = compensateScrollCallback;
  }

  async #initialiazeTimeBuckets() {
    const timebuckets = await getTimeBuckets({
      ...this.#options,
      size: TimeBucketSize.Month,
      key: getKey(),
    });

    this.buckets = timebuckets.map((bucket) => {
      const utcDate = DateTime.fromISO(bucket.timeBucket);
      return new AssetBucket(this, utcDate, bucket.timeBucket, bucket.count);
    });
    this.albumAssets.clear();
    await this.#updateViewportGeometry(false);
  }

  async updateOptions(options: AssetStoreOptions) {
    if (options.deferInit) {
      return;
    }
    if (this.#options !== AssetStore.#INIT_OPTIONS && isEqual(this.#options, options)) {
      return;
    }
    await this.initTask.reset();
    await this.#init(options);
    await this.#updateViewportGeometry(false);
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
    await this.#updateViewportGeometry(changedWidth);
  }

  async #updateViewportGeometry(changedWidth: boolean) {
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

    const loaders = [];
    let height = 0;
    for (const bucket of this.buckets) {
      if (height >= this.viewportHeight) {
        break;
      }
      height += bucket.bucketHeight;
      loaders.push(this.loadBucket(bucket.bucketDate));
    }
    await Promise.all(loaders);
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      bucketDate: bucket.bucketDate,
      bucketDateFormattted: bucket.bucketDateFormatted,
      bucketHeight: bucket.bucketHeight,
    }));
    this.scrubberTimelineHieght = this.timelineHeight;
  }

  createLayoutOptions() {
    const viewportWidth = this.viewportWidth;
    return {
      spacing: 2,
      heightTolerance: 0.15,
      rowHeight: 235,
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
        const unwrappedWidth = (3 / 2) * bucket.bucketCount * THUMBNAIL_HEIGHT * (7 / 10);
        const rows = Math.ceil(unwrappedWidth / viewportWidth);
        const height = 51 + Math.max(1, rows) * THUMBNAIL_HEIGHT;
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
        rowSpaceRemaining[dateGroupRow] -= GAP;
      }
      if (rowSpaceRemaining[dateGroupRow] >= 0) {
        assetGroup.row = dateGroupRow;
        assetGroup.col = dateGroupCol;
        assetGroup.left = cummulativeWidth;
        assetGroup.top = cummulativeHeight;

        dateGroupCol++;

        cummulativeWidth += assetGroup.width + GAP;
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
        cummulativeWidth += assetGroup.width + GAP;
        lastRow = assetGroup.row - 1;
      }
      lastRowHeight = assetGroup.height + HEADER;
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
    const bucket = this.getBucketByDate(bucketDate);
    if (!bucket) {
      return;
    }

    if (bucket.loader?.executed) {
      return;
    }

    const result = await bucket.loader?.execute(async (signal: AbortSignal) => {
      const assets = await getTimeBucket(
        {
          ...this.#options,
          timeBucket: bucketDate,
          size: TimeBucketSize.Month,
          key: getKey(),
        },
        { signal },
      );

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

      bucket.addAssets(assets, get(locale));
      this.#layoutBucket(bucket);
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
    this.#addAssetsToBuckets(notUpdated);
  }

  #addAssetsToBuckets(assets: AssetResponseDto[]) {
    if (assets.length === 0) {
      return;
    }
    const updatedBuckets = new Set<AssetBucket>();
    const updatedDateGroups = new Set<AssetDateGroup>();

    for (const asset of assets) {
      const utcMonth = DateTime.fromISO(asset.localDateTime).startOf('month');
      const bucketDate = utcMonth.toString();
      let bucket = this.getBucketByDate(bucketDate);

      if (!bucket) {
        bucket = new AssetBucket(this, utcMonth, bucketDate, 1);
        this.buckets.push(bucket);
      }
      bucket.addAssets([asset], get(locale));
      // bucket.assets.push(asset);
      updatedBuckets.add(bucket);
    }

    this.buckets = this.buckets.sort((a, b) => b.utcDate.diff(a.utcDate).milliseconds);

    for (const dateGroup of updatedDateGroups) {
      dateGroup.sortAssets();
    }
    for (const bucket of updatedBuckets) {
      bucket.sortDateGroups();
      this.#updateGeometry(bucket, true);
    }
    this.updateIntersections();
  }

  getBucketByDate(bucketDate: string): AssetBucket | undefined {
    return this.buckets.find((bucket) => bucket.bucketDate === bucketDate);
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
    await this.loadBucket(iso, options);
    return this.getBucketByDate(iso);
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
  #runAssetOp(ids: Set<string>, op: AssetOperation) {
    if (ids.size === 0) {
      return { processedIds: new Set(), unprocessedIds: ids, changedGeometry: false };
    }

    const changedBuckets = new Set<AssetBucket>();
    let idsToProcess = new Set(ids);
    const idsProcessed = new Set<string>();
    for (const bucket of this.buckets) {
      if (idsToProcess.size > 0) {
        const { processedIds, changedGeometry } = bucket.runAssetOp(idsToProcess, op);
        idsToProcess = idsToProcess.difference(processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        if (changedGeometry) {
          changedBuckets.add(bucket);
          break;
        }
      }
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

  updateAssetOp(ids: string[], op: AssetOperation) {
    this.#runAssetOp(new Set(ids), op);
  }

  updateAssets(assets: AssetResponseDto[]) {
    const lookup = new Map<string, AssetResponseDto>(assets.map((asset) => [asset.id, asset]));
    const { unprocessedIds } = this.#runAssetOp(new Set(lookup.keys()), (asset) => {
      updateObject(asset, lookup.get(asset.id));
      return { remove: false };
    });
    return unprocessedIds.values().map((id) => lookup.get(id)!);
  }

  removeAssets(ids: string[]) {
    const { unprocessedIds } = this.#runAssetOp(new Set(ids), () => {
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

  async getPreviousAsset(id: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    const bucket = await this.#getBucketInfoForAsset(id);
    if (!bucket) {
      return;
    }

    for (const group of bucket.dateGroups) {
      const index = group.intersetingAssets.findIndex((asset) => asset.id === asset.id);
      if (index > 0) {
        return group.intersetingAssets[index - 1].asset;
      }
    }

    const bucketIndex = this.buckets.indexOf(bucket);
    if (bucketIndex === 0) {
      return;
    }

    const previousBucket = this.buckets[bucketIndex - 1];
    await this.loadBucket(previousBucket.bucketDate);
    return previousBucket.lastDateGroup?.intersetingAssets.at(-1)?.asset;
  }

  async getNextAsset(asset: AssetResponseDto): Promise<AssetResponseDto | undefined> {
    const bucket = await this.#getBucketInfoForAsset(asset);
    if (!bucket) {
      return;
    }

    for (const group of bucket.dateGroups) {
      const index = group.intersetingAssets.findIndex((asset) => asset.id === asset.id);
      if (index !== -1 && index < group.intersetingAssets.length - 1) {
        return group.intersetingAssets[index + 1].asset;
      }
    }

    const bucketIndex = this.buckets.indexOf(bucket);
    if (bucketIndex === this.buckets.length - 1) {
      return;
    }

    const nextBucket = this.buckets[bucketIndex + 1];
    await this.loadBucket(nextBucket.bucketDate);
    return nextBucket.dateGroups[0]?.intersetingAssets[0]?.asset;
  }

  isExcluded(asset: AssetResponseDto) {
    return (
      isMismatched(this.#options.isArchived ?? false, asset.isArchived) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed ?? false, asset.isTrashed)
    );
  }
}

export const isSelectingAllAssets = writable(false);
