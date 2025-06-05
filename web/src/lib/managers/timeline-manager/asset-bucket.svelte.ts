import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import {
  formatBucketTitle,
  formatGroupTitle,
  fromISODateTimeWithOffsetToObject,
  fromTimelinePlainDate,
  fromTimelinePlainDateTime,
  fromTimelinePlainYearMonth,
  type TimelinePlainDateTime,
  type TimelinePlainYearMonth,
} from '$lib/utils/timeline-util';
import { AssetOrder, type TimeBucketAssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';
import { AddContext } from './add-context.svelte';
import { AssetDateGroup } from './asset-date-group.svelte';
import type { AssetStore } from './asset-store.svelte';
import { IntersectingAsset } from './intersecting-asset.svelte';
import type { AssetDescriptor, AssetOperation, Direction, MoveAsset, TimelineAsset } from './types';

export class AssetBucket {
  #intersecting: boolean = $state(false);
  actuallyIntersecting: boolean = $state(false);
  isLoaded: boolean = $state(false);
  dateGroups: AssetDateGroup[] = $state([]);
  readonly store: AssetStore;

  #bucketHeight: number = $state(0);
  #top: number = $state(0);

  #initialCount: number = 0;
  #sortOrder: AssetOrder = AssetOrder.Desc;
  percent: number = $state(0);

  bucketCount: number = $derived(
    this.isLoaded
      ? this.dateGroups.reduce((accumulator, g) => accumulator + g.intersectingAssets.length, 0)
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
      this.#handleLoadError,
    );
  }

  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old === newValue) {
      return;
    }
    this.#intersecting = newValue;
    if (newValue) {
      void this.store.loadBucket(this.yearMonth);
    } else {
      this.cancel();
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
        if (group.intersectingAssets.length === 0) {
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
        localDateTime: fromISODateTimeWithOffsetToObject(
          bucketAssets.fileCreatedAt[i],
          bucketAssets.localOffsetHours[i],
        ),
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
    dateGroup.intersectingAssets.push(intersectingAsset);
    addContext.changedDateGroups.add(dateGroup);
  }

  getRandomDateGroup() {
    const random = Math.floor(Math.random() * this.dateGroups.length);
    return this.dateGroups[random];
  }

  getRandomAsset() {
    return this.getRandomDateGroup()?.getRandomAsset()?.asset;
  }

  get viewId() {
    const { year, month } = this.yearMonth;
    return year + '-' + month;
  }

  set bucketHeight(height: number) {
    if (this.#bucketHeight === height) {
      return;
    }
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
      if (currentIndex > 0) {
        if (index < currentIndex) {
          store.scrollCompensation = {
            heightDelta: bucketHeightDelta,
            scrollTop: undefined,
            bucket: this,
          };
        } else if (percent > 0) {
          const top = this.top + height * percent;
          store.scrollCompensation = {
            heightDelta: undefined,
            scrollTop: top,
            bucket: this,
          };
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

  #handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  findDateGroupForAsset(asset: TimelineAsset) {
    for (const group of this.dateGroups) {
      if (group.intersectingAssets.some((IntersectingAsset) => IntersectingAsset.id === asset.id)) {
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
      const intersectingAsset = group.intersectingAssets.find((asset) => asset.id === assetId);
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
