import { authManager } from '$lib/managers/auth-manager.svelte';

import { CancellableTask } from '$lib/utils/cancellable-task';
import {
  getJustifiedLayoutFromAssets,
  getPosition,
  type CommonLayoutOptions,
  type CommonPosition,
} from '$lib/utils/layout-utils';
import {
  formatBucketTitle,
  formatGroupTitle,
  fromLocalDateTimeToObject,
  fromTimelinePlainDate,
  fromTimelinePlainDateTime,
  fromTimelinePlainYearMonth,
  plainDateTimeCompare,
  toISOLocalDateTime,
  toTimelineAsset,
  type TimelinePlainDate,
  type TimelinePlainDateTime,
  type TimelinePlainYearMonth,
} from '$lib/utils/timeline-util';
import { TUNABLES } from '$lib/utils/tunables';
import {
  AssetOrder,
  AssetVisibility,
  getAssetInfo,
  getTimeBucket,
  getTimeBuckets,
  type AssetStackResponseDto,
  type TimeBucketAssetResponseDto,
} from '@immich/sdk';
import { clamp, debounce, isEqual, throttle } from 'lodash-es';
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
type AssetDescriptor = { id: string };

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
    const isDate = target[key] instanceof Date;
    if (typeof target[key] === 'object' && !isDate) {
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
type Direction = 'earlier' | 'later';

export const assetSnapshot = (asset: TimelineAsset): TimelineAsset => $state.snapshot(asset) as TimelineAsset;
export const assetsSnapshot = (assets: TimelineAsset[]) => assets.map((asset) => $state.snapshot(asset));

export type TimelineAsset = {
  id: string;
  ownerId: string;
  ratio: number;
  thumbhash: string | null;
  localDateTime: TimelinePlainDateTime;
  visibility: AssetVisibility;
  isFavorite: boolean;
  isTrashed: boolean;
  isVideo: boolean;
  isImage: boolean;
  stack: AssetStackResponseDto | null;
  duration: string | null;
  projectionType: string | null;
  livePhotoVideoId: string | null;
  city: string | null;
  country: string | null;
  people: string[];
};

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
  asset: TimelineAsset = <TimelineAsset>$state();
  id: string | undefined = $derived(this.asset?.id);

  constructor(group: AssetDateGroup, asset: TimelineAsset) {
    this.#group = group;
    this.asset = asset;
  }
}

type AssetOperation = (asset: TimelineAsset) => { remove: boolean };

type MoveAsset = { asset: TimelineAsset; yearMonth: TimelinePlainYearMonth };

export class AssetDateGroup {
  // --- public
  readonly bucket: AssetBucket;
  readonly index: number;
  readonly groupTitle: string;
  readonly day: number;
  intersetingAssets: IntersectingAsset[] = $state([]);

  height = $state(0);
  width = $state(0);
  intersecting = $derived.by(() => this.intersetingAssets.some((asset) => asset.intersecting));

  // --- private
  top: number = $state(0);
  left: number = $state(0);
  row = $state(0);
  col = $state(0);
  deferredLayout = false;

  constructor(bucket: AssetBucket, index: number, day: number, groupTitle: string) {
    this.index = index;
    this.bucket = bucket;
    this.day = day;
    this.groupTitle = groupTitle;
  }

  sortAssets(sortOrder: AssetOrder = AssetOrder.Desc) {
    const sortFn = plainDateTimeCompare.bind(undefined, sortOrder === AssetOrder.Asc);
    this.intersetingAssets.sort((a, b) => sortFn(a.asset.localDateTime, b.asset.localDateTime));
  }

  getFirstAsset() {
    return this.intersetingAssets[0]?.asset;
  }

  getRandomAsset() {
    const random = Math.floor(Math.random() * this.intersetingAssets.length);
    return this.intersetingAssets[random];
  }

  *assetsIterator(options: { startAsset?: TimelineAsset; direction?: Direction } = {}) {
    const isEarlier = (options?.direction ?? 'earlier') === 'earlier';
    let assetIndex = options?.startAsset
      ? this.intersetingAssets.findIndex((intersectingAsset) => intersectingAsset.asset.id === options.startAsset!.id)
      : isEarlier
        ? 0
        : this.intersetingAssets.length - 1;

    while (assetIndex >= 0 && assetIndex < this.intersetingAssets.length) {
      const intersectingAsset = this.intersetingAssets[assetIndex];
      yield intersectingAsset.asset;
      assetIndex += isEarlier ? 1 : -1;
    }
  }

  getAssets() {
    return this.intersetingAssets.map((intersectingasset) => intersectingasset.asset);
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
      if (index === -1) {
        continue;
      }

      const asset = this.intersetingAssets[index].asset!;
      const oldTime = asset.localDateTime;
      let { remove } = operation(asset);
      const newTime = asset.localDateTime;
      if (oldTime.valueOf() !== newTime.valueOf()) {
        const year = newTime.year;
        const month = newTime.month;
        if (this.bucket.yearMonth.year !== year || this.bucket.yearMonth.month !== month) {
          remove = true;
          moveAssets.push({ asset, yearMonth: { year, month } });
        }
      }
      unprocessedIds.delete(assetId);
      processedIds.add(assetId);
      if (remove || this.bucket.store.isExcluded(asset)) {
        this.intersetingAssets.splice(index, 1);
        changedGeometry = true;
      }
    }
    return { moveAssets, processedIds, unprocessedIds, changedGeometry };
  }

  layout(options: CommonLayoutOptions, noDefer: boolean) {
    if (!noDefer && !this.bucket.intersecting) {
      this.deferredLayout = true;
      return;
    }
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
}

export interface Viewport {
  width: number;
  height: number;
}

export type ViewportXY = Viewport & {
  x: number;
  y: number;
};

class AddContext {
  lookupCache: {
    [year: number]: { [month: number]: { [day: number]: AssetDateGroup } };
  } = {};
  unprocessedAssets: TimelineAsset[] = [];
  changedDateGroups = new Set<AssetDateGroup>();
  newDateGroups = new Set<AssetDateGroup>();

  getDateGroup({ year, month, day }: TimelinePlainDate): AssetDateGroup | undefined {
    return this.lookupCache[year]?.[month]?.[day];
  }

  setDateGroup(dateGroup: AssetDateGroup, { year, month, day }: TimelinePlainDate) {
    if (!this.lookupCache[year]) {
      this.lookupCache[year] = {};
    }
    if (!this.lookupCache[year][month]) {
      this.lookupCache[year][month] = {};
    }
    this.lookupCache[year][month][day] = dateGroup;
  }

  get existingDateGroups() {
    return this.changedDateGroups.difference(this.newDateGroups);
  }

  get updatedBuckets() {
    const updated = new Set<AssetBucket>();
    for (const group of this.changedDateGroups) {
      updated.add(group.bucket);
    }
    return updated;
  }

  get bucketsWithNewDateGroups() {
    const updated = new Set<AssetBucket>();
    for (const group of this.newDateGroups) {
      updated.add(group.bucket);
    }
    return updated;
  }

  sort(bucket: AssetBucket, sortOrder: AssetOrder = AssetOrder.Desc) {
    for (const group of this.changedDateGroups) {
      group.sortAssets(sortOrder);
    }
    for (const group of this.newDateGroups) {
      group.sortAssets(sortOrder);
    }
    if (this.newDateGroups.size > 0) {
      bucket.sortDateGroups();
    }
  }
}

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
  readonly yearMonth: TimelinePlainYearMonth;

  constructor(
    store: AssetStore,
    yearMonth: TimelinePlainYearMonth,
    initialCount: number,
    order: AssetOrder = AssetOrder.Desc,
  ) {
    this.store = store;
    this.#initialCount = initialCount;
    this.#sortOrder = order;

    this.yearMonth = yearMonth;
    this.bucketDateFormatted = formatBucketTitle(fromTimelinePlainYearMonth(yearMonth));

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
        void this.store.loadBucket(this.yearMonth);
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
      (accumulator: TimelineAsset[], g: AssetDateGroup) => accumulator.concat(g.getAssets()),
      [],
    );
  }

  sortDateGroups() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.dateGroups.sort((a, b) => a.day - b.day);
    }

    return this.dateGroups.sort((a, b) => b.day - a.day);
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

  addAssets(bucketAssets: TimeBucketAssetResponseDto) {
    const addContext = new AddContext();
    const people: string[] = [];
    for (let i = 0; i < bucketAssets.id.length; i++) {
      const timelineAsset: TimelineAsset = {
        city: bucketAssets.city[i],
        country: bucketAssets.country[i],
        duration: bucketAssets.duration[i],
        id: bucketAssets.id[i],
        visibility: bucketAssets.visibility[i],
        isFavorite: bucketAssets.isFavorite[i],
        isImage: bucketAssets.isImage[i],
        isTrashed: bucketAssets.isTrashed[i],
        isVideo: !bucketAssets.isImage[i],
        livePhotoVideoId: bucketAssets.livePhotoVideoId[i],
        localDateTime: fromLocalDateTimeToObject(bucketAssets.localDateTime[i]),
        ownerId: bucketAssets.ownerId[i],
        people,
        projectionType: bucketAssets.projectionType[i],
        ratio: bucketAssets.ratio[i],
        stack: bucketAssets.stack?.[i]
          ? {
              id: bucketAssets.stack[i]![0],
              primaryAssetId: bucketAssets.id[i],
              assetCount: Number.parseInt(bucketAssets.stack[i]![1]),
            }
          : null,
        thumbhash: bucketAssets.thumbhash[i],
      };
      this.addTimelineAsset(timelineAsset, addContext);
    }

    for (const group of addContext.existingDateGroups) {
      group.sortAssets(this.#sortOrder);
    }

    if (addContext.newDateGroups.size > 0) {
      this.sortDateGroups();
    }

    addContext.sort(this, this.#sortOrder);

    return addContext.unprocessedAssets;
  }

  addTimelineAsset(timelineAsset: TimelineAsset, addContext: AddContext) {
    const { localDateTime } = timelineAsset;

    const { year, month } = this.yearMonth;
    if (month !== localDateTime.month || year !== localDateTime.year) {
      addContext.unprocessedAssets.push(timelineAsset);
      return;
    }

    let dateGroup = addContext.getDateGroup(localDateTime) || this.findDateGroupByDay(localDateTime.day);
    if (dateGroup) {
      addContext.setDateGroup(dateGroup, localDateTime);
    } else {
      const groupTitle = formatGroupTitle(fromTimelinePlainDate(localDateTime));
      dateGroup = new AssetDateGroup(this, this.dateGroups.length, localDateTime.day, groupTitle);
      this.dateGroups.push(dateGroup);
      addContext.setDateGroup(dateGroup, localDateTime);
      addContext.newDateGroups.add(dateGroup);
    }

    const intersectingAsset = new IntersectingAsset(dateGroup, timelineAsset);
    dateGroup.intersetingAssets.push(intersectingAsset);
    addContext.changedDateGroups.add(dateGroup);
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
    const { year, month } = this.yearMonth;
    return year + '-' + month;
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

  findDateGroupForAsset(asset: TimelineAsset) {
    for (const group of this.dateGroups) {
      if (group.intersetingAssets.some((IntersectingAsset) => IntersectingAsset.id === asset.id)) {
        return group;
      }
    }
  }

  findDateGroupByDay(day: number) {
    return this.dateGroups.find((group) => group.day === day);
  }

  findAssetAbsolutePosition(assetId: string) {
    this.store.clearDeferredLayout(this);
    for (const group of this.dateGroups) {
      const intersectingAsset = group.intersetingAssets.find((asset) => asset.id === assetId);
      if (intersectingAsset) {
        if (!intersectingAsset.position) {
          console.warn('No position for asset');
          break;
        }
        return this.top + group.top + intersectingAsset.position.top + this.store.headerHeight;
      }
    }
    return -1;
  }

  *assetsIterator(options?: { startDateGroup?: AssetDateGroup; startAsset?: TimelineAsset; direction?: Direction }) {
    const direction = options?.direction ?? 'earlier';
    let { startAsset } = options ?? {};
    const isEarlier = direction === 'earlier';
    let groupIndex = options?.startDateGroup
      ? this.dateGroups.indexOf(options.startDateGroup)
      : isEarlier
        ? 0
        : this.dateGroups.length - 1;

    while (groupIndex >= 0 && groupIndex < this.dateGroups.length) {
      const group = this.dateGroups[groupIndex];
      yield* group.assetsIterator({ startAsset, direction });
      startAsset = undefined;
      groupIndex += isEarlier ? 1 : -1;
    }
  }

  findAssetById(assetDescriptor: AssetDescriptor) {
    return this.assetsIterator().find((asset) => asset.id === assetDescriptor.id);
  }

  findClosest(target: TimelinePlainDateTime) {
    const targetDate = fromTimelinePlainDateTime(target);
    let closest = undefined;
    let smallestDiff = Infinity;
    for (const current of this.assetsIterator()) {
      const currentAssetDate = fromTimelinePlainDateTime(current.localDateTime);
      const diff = Math.abs(targetDate.diff(currentAssetDate).as('milliseconds'));
      if (diff < smallestDiff) {
        smallestDiff = diff;
        closest = current;
      }
    }
    return closest;
  }

  cancel() {
    this.loader?.cancel();
  }
}

const isMismatched = <T>(option: T | undefined, value: T): boolean => (option === undefined ? false : option !== value);

interface AddAsset {
  type: 'add';
  values: TimelineAsset[];
}

interface UpdateAsset {
  type: 'update';
  values: TimelineAsset[];
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
  year: number;
  month: number;
  bucketDateFormattted: string;
};

type AssetStoreLayoutOptions = {
  rowHeight?: number;
  headerHeight?: number;
  gap?: number;
};
interface UpdateGeometryOptions {
  invalidateHeight: boolean;
  noDefer?: boolean;
}

export class AssetStore {
  // --- public ----
  isInitialized = $state(false);
  buckets: AssetBucket[] = $state([]);
  topSectionHeight = $state(0);
  timelineHeight = $derived(
    this.buckets.reduce((accumulator, b) => accumulator + b.bucketHeight, 0) + this.topSectionHeight,
  );
  count = $derived(this.buckets.reduce((accumulator, b) => accumulator + b.bucketCount, 0));

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
  #headerHeight = $state(48);
  #gap = $state(12);

  #options: AssetStoreOptions = AssetStore.#INIT_OPTIONS;

  #scrolling = $state(false);
  #suspendTransitions = $state(false);
  #resetScrolling = debounce(() => (this.#scrolling = false), 1000);
  #resetSuspendTransitions = debounce(() => (this.suspendTransitions = false), 1000);

  constructor() {}

  setLayoutOptions({ headerHeight = 48, rowHeight = 235, gap = 12 }: AssetStoreLayoutOptions) {
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

  async *assetsIterator(options?: {
    startBucket?: AssetBucket;
    startDateGroup?: AssetDateGroup;
    startAsset?: TimelineAsset;
    direction?: Direction;
  }) {
    const direction = options?.direction ?? 'earlier';
    let { startDateGroup, startAsset } = options ?? {};
    for (const bucket of this.bucketsIterator({ direction, startBucket: options?.startBucket })) {
      await this.loadBucket(bucket.yearMonth, { cancelable: false });
      yield* bucket.assetsIterator({ startDateGroup, startAsset, direction });
      // after the first bucket, we won't find startDateGroup or startAsset, so clear them
      startDateGroup = startAsset = undefined;
    }
  }

  *bucketsIterator(options?: { direction?: Direction; startBucket?: AssetBucket }) {
    const isEarlier = options?.direction === 'earlier';
    let startIndex = options?.startBucket
      ? this.buckets.indexOf(options.startBucket)
      : isEarlier
        ? 0
        : this.buckets.length - 1;

    while (startIndex >= 0 && startIndex < this.buckets.length) {
      yield this.buckets[startIndex];
      startIndex += isEarlier ? 1 : -1;
    }
  }

  #addPendingChanges(...changes: PendingChange[]) {
    this.#pendingChanges.push(...changes);
    this.#processPendingChanges();
  }

  connect() {
    this.#unsubscribers.push(
      websocketEvents.on('on_upload_success', (asset) =>
        this.#addPendingChanges({ type: 'add', values: [toTimelineAsset(asset)] }),
      ),
      websocketEvents.on('on_asset_trash', (ids) => this.#addPendingChanges({ type: 'trash', values: ids })),
      websocketEvents.on('on_asset_update', (asset) =>
        this.#addPendingChanges({ type: 'update', values: [toTimelineAsset(asset)] }),
      ),
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
      add: TimelineAsset[];
      update: TimelineAsset[];
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

  #findBucketForAsset(id: string) {
    for (const bucket of this.buckets) {
      const asset = bucket.findAssetById({ id });
      if (asset) {
        return { bucket, asset };
      }
    }
  }

  #findBucketForDate(targetYearMonth: TimelinePlainYearMonth) {
    for (const bucket of this.buckets) {
      const { year, month } = bucket.yearMonth;
      if (month === targetYearMonth.month && year === targetYearMonth.year) {
        return bucket;
      }
    }
  }

  updateSlidingWindow(scrollTop: number) {
    if (this.#scrollTop !== scrollTop) {
      this.#scrollTop = scrollTop;
      this.updateIntersections();
    }
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

  clearDeferredLayout(bucket: AssetBucket) {
    const hasDeferred = bucket.dateGroups.some((group) => group.deferredLayout);
    if (hasDeferred) {
      this.#updateGeometry(bucket, { invalidateHeight: true, noDefer: true });
      for (const group of bucket.dateGroups) {
        group.deferredLayout = false;
      }
    }
  }

  #updateIntersection(bucket: AssetBucket) {
    const actuallyIntersecting = this.#calculateIntersecting(bucket, 0, 0);
    let preIntersecting = false;
    if (!actuallyIntersecting) {
      preIntersecting = this.#calculateIntersecting(bucket, INTERSECTION_EXPAND_TOP, INTERSECTION_EXPAND_BOTTOM);
    }
    bucket.intersecting = actuallyIntersecting || preIntersecting;
    bucket.actuallyIntersecting = actuallyIntersecting;
    if (preIntersecting || actuallyIntersecting) {
      this.clearDeferredLayout(bucket);
    }
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
      key: authManager.key,
    });

    this.buckets = timebuckets.map((bucket) => {
      const date = new Date(bucket.timeBucket);
      return new AssetBucket(
        this,
        { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1 },
        bucket.count,
        this.#options.order,
      );
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
      this.#updateGeometry(bucket, { invalidateHeight: changedWidth });
    }
    this.updateIntersections();
    this.#createScrubBuckets();
  }

  #createScrubBuckets() {
    this.scrubberBuckets = this.buckets.map((bucket) => ({
      assetCount: bucket.bucketCount,
      year: bucket.yearMonth.year,
      month: bucket.yearMonth.month,
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

  #updateGeometry(bucket: AssetBucket, options: UpdateGeometryOptions) {
    const { invalidateHeight, noDefer = false } = options;
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
    this.#layoutBucket(bucket, noDefer);
  }

  #layoutBucket(bucket: AssetBucket, noDefer: boolean = false) {
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
      assetGroup.layout(options, noDefer);
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

  async loadBucket(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }): Promise<void> {
    let cancelable = true;
    if (options) {
      cancelable = options.cancelable;
    }
    const bucket = this.getBucketByDate(yearMonth);
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
      const timeBucket = toISOLocalDateTime(bucket.yearMonth);
      const key = authManager.key;
      const bucketResponse = await getTimeBucket(
        {
          ...this.#options,
          timeBucket,
          key,
        },
        { signal },
      );
      if (bucketResponse) {
        if (this.#options.timelineAlbumId) {
          const albumAssets = await getTimeBucket(
            {
              albumId: this.#options.timelineAlbumId,
              timeBucket,
              key,
            },
            { signal },
          );
          for (const id of albumAssets.id) {
            this.albumAssets.add(id);
          }
        }
        const unprocessedAssets = bucket.addAssets(bucketResponse);
        if (unprocessedAssets.length > 0) {
          console.error(
            `Warning: getTimeBucket API returning assets not in requested month: ${bucket.yearMonth.month}, ${JSON.stringify(
              unprocessedAssets.map((unprocessed) => ({
                id: unprocessed.id,
                localDateTime: unprocessed.localDateTime,
              })),
            )}`,
          );
        }
        this.#layoutBucket(bucket);
      }
    }, cancelable);
    if (result === 'LOADED') {
      this.#updateIntersection(bucket);
    }
  }

  addAssets(assets: TimelineAsset[]) {
    const assetsToUpdate: TimelineAsset[] = [];

    for (const asset of assets) {
      if (this.isExcluded(asset)) {
        continue;
      }
      assetsToUpdate.push(asset);
    }

    const notUpdated = this.updateAssets(assetsToUpdate);
    this.#addAssetsToBuckets([...notUpdated]);
  }

  #addAssetsToBuckets(assets: TimelineAsset[]) {
    if (assets.length === 0) {
      return;
    }

    const addContext = new AddContext();
    const updatedBuckets = new Set<AssetBucket>();
    const bucketCount = this.buckets.length;
    for (const asset of assets) {
      let bucket = this.getBucketByDate(asset.localDateTime);

      if (!bucket) {
        bucket = new AssetBucket(this, asset.localDateTime, 1, this.#options.order);
        this.buckets.push(bucket);
      }

      bucket.addTimelineAsset(asset, addContext);
      updatedBuckets.add(bucket);
    }

    if (this.buckets.length !== bucketCount) {
      this.buckets.sort((a, b) => {
        return a.yearMonth.year === b.yearMonth.year
          ? b.yearMonth.month - a.yearMonth.month
          : b.yearMonth.year - a.yearMonth.year;
      });
    }

    for (const group of addContext.existingDateGroups) {
      group.sortAssets(this.#options.order);
    }

    for (const bucket of addContext.bucketsWithNewDateGroups) {
      bucket.sortDateGroups();
    }

    for (const bucket of addContext.updatedBuckets) {
      bucket.sortDateGroups();
      this.#updateGeometry(bucket, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getBucketByDate(targetYearMonth: TimelinePlainYearMonth): AssetBucket | undefined {
    return this.buckets.find(
      (bucket) => bucket.yearMonth.year === targetYearMonth.year && bucket.yearMonth.month === targetYearMonth.month,
    );
  }

  async findBucketForAsset(id: string) {
    await this.initTask.waitUntilCompletion();
    let { bucket } = this.#findBucketForAsset(id) ?? {};
    if (bucket) {
      return bucket;
    }
    const asset = toTimelineAsset(await getAssetInfo({ id, key: authManager.key }));
    if (!asset || this.isExcluded(asset)) {
      return;
    }
    bucket = await this.#loadBucketAtTime(asset.localDateTime, { cancelable: false });
    if (bucket?.findAssetById({ id })) {
      return bucket;
    }
  }

  async #loadBucketAtTime(yearMonth: TimelinePlainYearMonth, options?: { cancelable: boolean }) {
    await this.loadBucket(yearMonth, options);
    return this.getBucketByDate(yearMonth);
  }

  getBucketIndexByAssetId(assetId: string) {
    const bucketInfo = this.#findBucketForAsset(assetId);
    return bucketInfo?.bucket;
  }

  async getRandomBucket() {
    const random = Math.floor(Math.random() * this.buckets.length);
    const bucket = this.buckets[random];
    await this.loadBucket(bucket.yearMonth, { cancelable: false });
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
    const combinedMoveAssets: { asset: TimelineAsset; yearMonth: TimelinePlainYearMonth }[][] = [];
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
      this.#updateGeometry(bucket, { invalidateHeight: true });
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

  updateAssets(assets: TimelineAsset[]) {
    const lookup = new Map<string, TimelineAsset>(assets.map((asset) => [asset.id, asset]));
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
      this.#updateGeometry(bucket, { invalidateHeight: true });
    }
    this.updateIntersections();
  }

  getFirstAsset(): TimelineAsset | undefined {
    return this.buckets[0]?.getFirstAsset();
  }

  async getLaterAsset(
    assetDescriptor: AssetDescriptor,
    magnitude: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await this.#getAssetWithOffset(assetDescriptor, magnitude, 'later');
  }

  async getEarlierAsset(
    assetDescriptor: AssetDescriptor,
    magnitude: 'asset' | 'day' | 'month' | 'year' = 'asset',
  ): Promise<TimelineAsset | undefined> {
    return await this.#getAssetWithOffset(assetDescriptor, magnitude, 'earlier');
  }

  async getClosestAssetToDate(dateTime: TimelinePlainDateTime) {
    const bucket = this.#findBucketForDate(dateTime);
    if (!bucket) {
      return;
    }
    await this.loadBucket(dateTime, { cancelable: false });
    const asset = bucket.findClosest(dateTime);
    if (asset) {
      return asset;
    }
    for await (const asset of this.assetsIterator({ startBucket: bucket })) {
      return asset;
    }
  }

  async retrieveRange(start: AssetDescriptor, end: AssetDescriptor) {
    let { asset: startAsset, bucket: startBucket } = this.#findBucketForAsset(start.id) ?? {};
    if (!startBucket || !startAsset) {
      return [];
    }
    let { asset: endAsset, bucket: endBucket } = this.#findBucketForAsset(end.id) ?? {};
    if (!endBucket || !endAsset) {
      return [];
    }
    let direction: Direction = 'earlier';
    if (plainDateTimeCompare(true, startAsset.localDateTime, endAsset.localDateTime) < 0) {
      // swap startAsset, startBucket with endAsset, endBucket
      [startAsset, endAsset] = [endAsset, startAsset];
      [startBucket, endBucket] = [endBucket, startBucket];
      direction = 'earlier';
    }

    const range: TimelineAsset[] = [];
    const startDateGroup = startBucket.findDateGroupForAsset(startAsset);
    for await (const targetAsset of this.assetsIterator({
      startBucket,
      startDateGroup,
      startAsset,
      direction,
    })) {
      range.push(targetAsset);
      if (targetAsset.id === endAsset.id) {
        break;
      }
    }
    return range;
  }

  async #getAssetWithOffset(
    assetDescriptor: AssetDescriptor,
    magnitude: 'asset' | 'day' | 'month' | 'year' = 'asset',
    direction: Direction,
  ): Promise<TimelineAsset | undefined> {
    const { asset, bucket } = this.#findBucketForAsset(assetDescriptor.id) ?? {};
    if (!bucket || !asset) {
      return;
    }

    switch (magnitude) {
      case 'asset': {
        return this.#getAssetByAssetOffset(asset, bucket, direction);
      }
      case 'day': {
        return this.#getAssetByDayOffset(asset, bucket, direction);
      }
      case 'month': {
        return this.#getAssetByMonthOffset(asset, bucket, direction);
      }
      case 'year': {
        return this.#getAssetByYearOffset(asset, bucket, direction);
      }
    }
  }

  async #getAssetByAssetOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    const dateGroup = bucket.findDateGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
      startBucket: bucket,
      startDateGroup: dateGroup,
      startAsset: asset,
      direction,
    })) {
      if (asset.id === targetAsset.id) {
        continue;
      }
      return targetAsset;
    }
  }

  async #getAssetByDayOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    const dateGroup = bucket.findDateGroupForAsset(asset);
    for await (const targetAsset of this.assetsIterator({
      startBucket: bucket,
      startDateGroup: dateGroup,
      startAsset: asset,
      direction,
    })) {
      if (targetAsset.localDateTime.day !== asset.localDateTime.day) {
        return targetAsset;
      }
    }
  }

  // starting at bucket, go to the earlier/later bucket by month, returning the first asset in that bucket
  async #getAssetByMonthOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    for (const targetBucket of this.bucketsIterator({ startBucket: bucket, direction })) {
      if (targetBucket.yearMonth.month !== bucket.yearMonth.month) {
        for await (const targetAsset of this.assetsIterator({ startBucket: targetBucket, direction })) {
          return targetAsset;
        }
      }
    }
  }

  async #getAssetByYearOffset(asset: TimelineAsset, bucket: AssetBucket, direction: Direction) {
    for (const targetBucket of this.bucketsIterator({ startBucket: bucket, direction })) {
      if (targetBucket.yearMonth.year !== bucket.yearMonth.year) {
        for await (const targetAsset of this.assetsIterator({ startBucket: targetBucket, direction })) {
          return targetAsset;
        }
      }
    }
  }

  isExcluded(asset: TimelineAsset) {
    return (
      isMismatched(this.#options.visibility, asset.visibility) ||
      isMismatched(this.#options.isFavorite, asset.isFavorite) ||
      isMismatched(this.#options.isTrashed, asset.isTrashed)
    );
  }
}

export const isSelectingAllAssets = writable(false);
