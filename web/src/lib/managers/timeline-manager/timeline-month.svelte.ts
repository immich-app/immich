import { AssetOrder, type TimeBucketAssetResponseDto } from '@immich/sdk';

import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import {
  formatGroupTitle,
  formatTimelineMonthTitle,
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

import {
  ViewportProximity,
  isInOrNearViewport as isInOrNearViewportUtil,
  isInViewport as isInViewportUtil,
} from '$lib/managers/timeline-manager/internal/intersection-support.svelte';
import { SvelteSet } from 'svelte/reactivity';
import { GroupInsertionCache } from './group-insertion-cache.svelte';
import { TimelineDay } from './timeline-day.svelte';
import type { TimelineManager } from './timeline-manager.svelte';
import type { AssetDescriptor, Direction, MoveAsset, TimelineAsset } from './types';
import { ViewerAsset } from './viewer-asset.svelte';

export class TimelineMonth {
  #viewportProximity: ViewportProximity = $state(ViewportProximity.FarFromViewport);
  isLoaded: boolean = $state(false);
  timelineDays: TimelineDay[] = $state([]);
  readonly timelineManager: TimelineManager;

  #height: number = $state(0);
  #top: number = $state(0);

  #initialCount: number = 0;
  #sortOrder: AssetOrder = AssetOrder.Desc;
  percent: number = $state(0);

  assetsCount: number = $derived(
    this.isLoaded
      ? this.timelineDays.reduce((accumulator, g) => accumulator + g.viewerAssets.length, 0)
      : this.#initialCount,
  );
  loader: CancellableTask | undefined;
  isHeightActual: boolean = $state(false);

  readonly title: string;
  readonly yearMonth: TimelineYearMonth;

  constructor(
    timelineManager: TimelineManager,
    yearMonth: TimelineYearMonth,
    initialCount: number,
    loaded: boolean,
    order: AssetOrder = AssetOrder.Desc,
  ) {
    this.timelineManager = timelineManager;
    this.#initialCount = initialCount;
    this.#sortOrder = order;

    this.yearMonth = { year: yearMonth.year, month: yearMonth.month };
    this.title = formatTimelineMonthTitle(fromTimelinePlainYearMonth(yearMonth));

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
        this.timelineDays = [];
        this.isLoaded = false;
      },
      this.#handleLoadError,
    );
    if (loaded) {
      this.isLoaded = true;
    }
  }

  set viewportProximity(newValue: ViewportProximity) {
    const old = this.#viewportProximity;
    if (old === newValue) {
      return;
    }
    this.#viewportProximity = newValue;
    if (isInOrNearViewportUtil(newValue)) {
      void this.timelineManager.loadTimelineMonth(this.yearMonth);
    } else {
      this.cancel();
    }
  }

  get isInOrNearViewport() {
    return isInOrNearViewportUtil(this.#viewportProximity);
  }

  get isInViewport() {
    return isInViewportUtil(this.#viewportProximity);
  }

  get lastTimelineDay() {
    return this.timelineDays.at(-1);
  }

  getFirstAsset() {
    return this.timelineDays[0]?.getFirstAsset();
  }

  getAssets() {
    // eslint-disable-next-line unicorn/no-array-reduce
    return this.timelineDays.reduce(
      (accumulator: TimelineAsset[], g: TimelineDay) => accumulator.concat(g.getAssets()),
      [],
    );
  }

  sortTimelineDays() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.timelineDays.sort((a, b) => a.day - b.day);
    }

    return this.timelineDays.sort((a, b) => b.day - a.day);
  }

  runAssetCallback(ids: Set<string>, callback: (asset: TimelineAsset) => void | { remove?: boolean }) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as MoveAsset[],
        processedIds: new SvelteSet<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const { timelineDays } = this;
    let combinedChangedGeometry = false;
    let idsToProcess = new SvelteSet(ids);
    const idsProcessed = new SvelteSet<string>();
    const combinedMoveAssets: MoveAsset[][] = [];
    let index = timelineDays.length;
    while (index--) {
      if (idsToProcess.size > 0) {
        const group = timelineDays[index];
        const { moveAssets, processedIds, changedGeometry } = group.runAssetCallback(ids, callback);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(moveAssets);
        }
        idsToProcess = setDifference(idsToProcess, processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        combinedChangedGeometry = combinedChangedGeometry || changedGeometry;
        if (group.viewerAssets.length === 0) {
          timelineDays.splice(index, 1);
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

  addAssets(bucketAssets: TimeBucketAssetResponseDto, preSorted: boolean) {
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

      if (this.timelineManager.isExcluded(timelineAsset)) {
        continue;
      }

      this.addTimelineAsset(timelineAsset, addContext);
    }
    if (preSorted) {
      return addContext.unprocessedAssets;
    }

    for (const group of addContext.existingTimelineDays) {
      group.sortAssets(this.#sortOrder);
    }

    if (addContext.newTimelineDays.size > 0) {
      this.sortTimelineDays();
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

    let timelineDay = addContext.getTimelineDay(localDateTime) || this.findTimelineDayByDay(localDateTime.day);
    if (timelineDay) {
      addContext.setTimelineDay(timelineDay, localDateTime);
    } else {
      const groupTitle = formatGroupTitle(fromTimelinePlainDate(localDateTime));
      timelineDay = new TimelineDay(this, this.timelineDays.length, localDateTime.day, groupTitle);
      this.timelineDays.push(timelineDay);
      addContext.setTimelineDay(timelineDay, localDateTime);
      addContext.newTimelineDays.add(timelineDay);
    }

    const viewerAsset = new ViewerAsset(timelineDay, timelineAsset);
    timelineDay.viewerAssets.push(viewerAsset);
    addContext.changedTimelineDays.add(timelineDay);
  }

  get viewId() {
    const { year, month } = this.yearMonth;
    return year + '-' + month;
  }

  set height(height: number) {
    if (this.#height === height) {
      return;
    }
    const timelineManager = this.timelineManager;
    const index = timelineManager.months.indexOf(this);
    const heightDelta = height - this.#height;
    this.#height = height;
    const previousTimelineMonth = timelineManager.months[index - 1];
    if (previousTimelineMonth) {
      const newTop = previousTimelineMonth.#top + previousTimelineMonth.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    if (heightDelta === 0) {
      return;
    }
    for (let cursor = index + 1; cursor < timelineManager.months.length; cursor++) {
      const timelineMonth = this.timelineManager.months[cursor];
      const newTop = timelineMonth.#top + heightDelta;
      if (timelineMonth.#top !== newTop) {
        timelineMonth.#top = newTop;
      }
    }
    if (!timelineManager.viewportTopMonthIntersection) {
      return;
    }
    const { month, monthBottomViewportRatio, viewportTopRatioInMonth } = timelineManager.viewportTopMonthIntersection;
    const currentIndex = month ? timelineManager.months.indexOf(month) : -1;
    if (!month || currentIndex <= 0 || index > currentIndex) {
      return;
    }
    if (index < currentIndex || monthBottomViewportRatio < 1) {
      timelineManager.scrollBy(heightDelta);
    } else if (index === currentIndex) {
      const scrollTo = this.top + height * viewportTopRatioInMonth;
      timelineManager.scrollTo(scrollTo);
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

  findTimelineDayForAsset(asset: TimelineAsset) {
    for (const group of this.timelineDays) {
      if (group.viewerAssets.some((viewerAsset) => viewerAsset.id === asset.id)) {
        return group;
      }
    }
  }

  findTimelineDayByDay(day: number) {
    return this.timelineDays.find((group) => group.day === day);
  }

  findAssetAbsolutePosition(assetId: string) {
    this.timelineManager.clearDeferredLayout(this);
    for (const group of this.timelineDays) {
      const viewerAsset = group.viewerAssets.find((viewAsset) => viewAsset.id === assetId);
      if (viewerAsset) {
        if (!viewerAsset.position) {
          console.warn('No position for asset');
          return;
        }
        return {
          top: this.top + group.top + viewerAsset.position.top + this.timelineManager.headerHeight,
          height: viewerAsset.position.height,
        };
      }
    }
  }

  *assetsIterator(options?: { startTimelineDay?: TimelineDay; startAsset?: TimelineAsset; direction?: Direction }) {
    const direction = options?.direction ?? 'earlier';
    let { startAsset } = options ?? {};
    const isEarlier = direction === 'earlier';
    let groupIndex = options?.startTimelineDay
      ? this.timelineDays.indexOf(options.startTimelineDay)
      : isEarlier
        ? 0
        : this.timelineDays.length - 1;

    while (groupIndex >= 0 && groupIndex < this.timelineDays.length) {
      const group = this.timelineDays[groupIndex];
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
