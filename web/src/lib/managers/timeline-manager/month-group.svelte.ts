import { AssetOrder, type TimeBucketAssetResponseDto } from '@immich/sdk';

import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import {
  formatGroupTitle,
  formatMonthGroupTitle,
  fromTimelinePlainDate,
  fromTimelinePlainDateTime,
  fromTimelinePlainYearMonth,
  getTimes,
  setDifference,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';

import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

import { SvelteSet } from 'svelte/reactivity';
import { DayGroup } from './day-group.svelte';
import { GroupInsertionCache } from './group-insertion-cache.svelte';
import type { TimelineManager } from './timeline-manager.svelte';
import type { AssetDescriptor, AssetOperation, Direction, MoveAsset, TimelineAsset } from './types';
import { ViewerAsset } from './viewer-asset.svelte';

export class MonthGroup {
  #intersecting: boolean = $state(false);
  actuallyIntersecting: boolean = $state(false);
  isLoaded: boolean = $state(false);
  dayGroups: DayGroup[] = $state([]);
  readonly timelineManager: TimelineManager;

  #height: number = $state(0);
  #top: number = $state(0);

  #initialCount: number = 0;
  #sortOrder: AssetOrder = AssetOrder.Desc;
  percent: number = $state(0);

  assetsCount: number = $derived(
    this.isLoaded
      ? this.dayGroups.reduce((accumulator, g) => accumulator + g.viewerAssets.length, 0)
      : this.#initialCount,
  );
  loader: CancellableTask | undefined;
  isHeightActual: boolean = $state(false);

  readonly monthGroupTitle: string;
  readonly yearMonth: TimelineYearMonth;

  constructor(
    store: TimelineManager,
    yearMonth: TimelineYearMonth,
    initialCount: number,
    order: AssetOrder = AssetOrder.Desc,
  ) {
    this.timelineManager = store;
    this.#initialCount = initialCount;
    this.#sortOrder = order;

    this.yearMonth = yearMonth;
    this.monthGroupTitle = formatMonthGroupTitle(fromTimelinePlainYearMonth(yearMonth));

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
        this.dayGroups = [];
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
      void this.timelineManager.loadMonthGroup(this.yearMonth);
    } else {
      this.cancel();
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  get lastDayGroup() {
    return this.dayGroups.at(-1);
  }

  getFirstAsset() {
    return this.dayGroups[0]?.getFirstAsset();
  }

  getAssets() {
    // eslint-disable-next-line unicorn/no-array-reduce
    return this.dayGroups.reduce((accumulator: TimelineAsset[], g: DayGroup) => accumulator.concat(g.getAssets()), []);
  }

  sortDayGroups() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.dayGroups.sort((a, b) => a.day - b.day);
    }

    return this.dayGroups.sort((a, b) => b.day - a.day);
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as MoveAsset[],
        processedIds: new SvelteSet<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const { dayGroups } = this;
    let combinedChangedGeometry = false;
    let idsToProcess = new SvelteSet(ids);
    const idsProcessed = new SvelteSet<string>();
    const combinedMoveAssets: MoveAsset[][] = [];
    let index = dayGroups.length;
    while (index--) {
      if (idsToProcess.size > 0) {
        const group = dayGroups[index];
        const { moveAssets, processedIds, changedGeometry } = group.runAssetOperation(ids, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = setDifference(idsToProcess, processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        combinedChangedGeometry = combinedChangedGeometry || changedGeometry;
        if (group.viewerAssets.length === 0) {
          dayGroups.splice(index, 1);
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
    const addContext = new GroupInsertionCache();
    for (let i = 0; i < bucketAssets.id.length; i++) {
      const { localDateTime, fileCreatedAt } = getTimes(
        bucketAssets.fileCreatedAt[i],
        bucketAssets.localOffsetHours[i],
      );

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
        localDateTime,
        fileCreatedAt,
        ownerId: bucketAssets.ownerId[i],
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
        people: null, // People are not included in the bucket assets
      };

      if (bucketAssets.latitude?.[i] && bucketAssets.longitude?.[i]) {
        timelineAsset.latitude = bucketAssets.latitude?.[i];
        timelineAsset.longitude = bucketAssets.longitude?.[i];
      }
      this.addTimelineAsset(timelineAsset, addContext);
    }

    for (const group of addContext.existingDayGroups) {
      group.sortAssets(this.#sortOrder);
    }

    if (addContext.newDayGroups.size > 0) {
      this.sortDayGroups();
    }

    addContext.sort(this, this.#sortOrder);

    return addContext.unprocessedAssets;
  }

  addTimelineAsset(timelineAsset: TimelineAsset, addContext: GroupInsertionCache) {
    const { localDateTime } = timelineAsset;

    const { year, month } = this.yearMonth;
    if (month !== localDateTime.month || year !== localDateTime.year) {
      addContext.unprocessedAssets.push(timelineAsset);
      return;
    }

    let dayGroup = addContext.getDayGroup(localDateTime) || this.findDayGroupByDay(localDateTime.day);
    if (dayGroup) {
      addContext.setDayGroup(dayGroup, localDateTime);
    } else {
      const groupTitle = formatGroupTitle(fromTimelinePlainDate(localDateTime));
      dayGroup = new DayGroup(this, this.dayGroups.length, localDateTime.day, groupTitle);
      this.dayGroups.push(dayGroup);
      addContext.setDayGroup(dayGroup, localDateTime);
      addContext.newDayGroups.add(dayGroup);
    }

    const viewerAsset = new ViewerAsset(dayGroup, timelineAsset);
    dayGroup.viewerAssets.push(viewerAsset);
    addContext.changedDayGroups.add(dayGroup);
  }

  getRandomDayGroup() {
    const random = Math.floor(Math.random() * this.dayGroups.length);
    return this.dayGroups[random];
  }

  getRandomAsset() {
    return this.getRandomDayGroup()?.getRandomAsset()?.asset;
  }

  get viewId() {
    const { year, month } = this.yearMonth;
    return year + '-' + month;
  }

  set height(height: number) {
    if (this.#height === height) {
      return;
    }
    const { timelineManager: store, percent } = this;
    const index = store.months.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const prevMonthGroup = store.months[index - 1];
    if (prevMonthGroup) {
      const newTop = prevMonthGroup.#top + prevMonthGroup.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    for (let cursor = index + 1; cursor < store.months.length; cursor++) {
      const monthGroup = this.timelineManager.months[cursor];
      const newTop = monthGroup.#top + heightDelta;
      if (monthGroup.#top !== newTop) {
        monthGroup.#top = newTop;
      }
    }
    if (store.topIntersectingMonthGroup) {
      const currentIndex = store.months.indexOf(store.topIntersectingMonthGroup);
      if (currentIndex > 0) {
        if (index < currentIndex) {
          store.scrollCompensation = {
            heightDelta,
            scrollTop: undefined,
            monthGroup: this,
          };
        } else if (percent > 0) {
          const top = this.top + height * percent;
          store.scrollCompensation = {
            heightDelta: undefined,
            scrollTop: top,
            monthGroup: this,
          };
        }
      }
    }
  }

  get height() {
    return this.#height;
  }

  get top(): number {
    return this.#top + this.timelineManager.topSectionHeight;
  }

  #handleLoadError(error: unknown) {
    const _$t = get(t);
    handleError(error, _$t('errors.failed_to_load_assets'));
  }

  findDayGroupForAsset(asset: TimelineAsset) {
    for (const group of this.dayGroups) {
      if (group.viewerAssets.some((viewerAsset) => viewerAsset.id === asset.id)) {
        return group;
      }
    }
  }

  findDayGroupByDay(day: number) {
    return this.dayGroups.find((group) => group.day === day);
  }

  findAssetAbsolutePosition(assetId: string) {
    this.timelineManager.clearDeferredLayout(this);
    for (const group of this.dayGroups) {
      const viewerAsset = group.viewerAssets.find((viewAsset) => viewAsset.id === assetId);
      if (viewerAsset) {
        if (!viewerAsset.position) {
          console.warn('No position for asset');
          break;
        }
        return this.top + group.top + viewerAsset.position.top + this.timelineManager.headerHeight;
      }
    }
    return -1;
  }

  *assetsIterator(options?: { startDayGroup?: DayGroup; startAsset?: TimelineAsset; direction?: Direction }) {
    const direction = options?.direction ?? 'earlier';
    let { startAsset } = options ?? {};
    const isEarlier = direction === 'earlier';
    let groupIndex = options?.startDayGroup
      ? this.dayGroups.indexOf(options.startDayGroup)
      : isEarlier
        ? 0
        : this.dayGroups.length - 1;

    while (groupIndex >= 0 && groupIndex < this.dayGroups.length) {
      const group = this.dayGroups[groupIndex];
      yield* group.assetsIterator({ startAsset, direction });
      startAsset = undefined;
      groupIndex += isEarlier ? 1 : -1;
    }
  }

  findAssetById(assetDescriptor: AssetDescriptor) {
    for (const asset of this.assetsIterator()) {
      if (asset.id === assetDescriptor.id) {
        return asset;
      }
    }
  }

  findClosest(target: TimelineDateTime) {
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
