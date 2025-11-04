import { GroupInsertionCache } from '$lib/managers/timeline-manager/group-insertion-cache.svelte';
import { onCreateMonth } from '$lib/managers/timeline-manager/internal/TestHooks.svelte';
import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import type { AssetDescriptor, AssetOperation, Direction, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { ScrollSegment } from '$lib/managers/VirtualScrollManager/ScrollSegment.svelte';
import { CancellableTask } from '$lib/utils/cancellable-task';
import { handleError } from '$lib/utils/handle-error';
import {
  formatDayTitle,
  formatMonthTitle,
  fromTimelinePlainDate,
  fromTimelinePlainDateTime,
  fromTimelinePlainYearMonth,
  getTimes,
  setDifferenceInPlace,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';
import { AssetOrder, type TimeBucketAssetResponseDto } from '@immich/sdk';
import { t } from 'svelte-i18n';
import { get } from 'svelte/store';

export class TimelineMonth extends ScrollSegment {
  #intersecting: boolean = $state(false);
  actuallyIntersecting: boolean = $state(false);
  isLoaded: boolean = $state(false);
  days: TimelineDay[] = $state([]);
  readonly timelineManager: TimelineManager;

  #height: number = $state(0);
  #top: number = $state(0);

  #initialCount: number = 0;
  #sortOrder: AssetOrder = AssetOrder.Desc;
  percent: number = $state(0);

  assetsCount: number = $derived(
    this.isLoaded ? this.days.reduce((accumulator, g) => accumulator + g.viewerAssets.length, 0) : this.#initialCount,
  );
  loader: CancellableTask | undefined;
  isHeightActual: boolean = $state(false);

  readonly monthTitle: string;
  readonly yearMonth: TimelineYearMonth;

  constructor(
    timelineManager: TimelineManager,
    yearMonth: TimelineYearMonth,
    initialCount: number,
    loaded: boolean,
    order: AssetOrder = AssetOrder.Desc,
  ) {
    super();
    this.timelineManager = timelineManager;
    this.#initialCount = initialCount;
    this.#sortOrder = order;

    this.yearMonth = yearMonth;
    this.monthTitle = formatMonthTitle(fromTimelinePlainYearMonth(yearMonth));

    this.loader = new CancellableTask(
      () => {
        this.isLoaded = true;
      },
      () => {
        this.days = [];
        this.isLoaded = false;
      },
      this.#handleLoadError,
    );
    if (loaded) {
      this.isLoaded = true;
    }
    if (import.meta.env.DEV) {
      onCreateMonth(this);
    }
  }

  set intersecting(newValue: boolean) {
    const old = this.#intersecting;
    if (old === newValue) {
      return;
    }
    this.#intersecting = newValue;
    if (newValue) {
      void this.timelineManager.loadMonth(this.yearMonth);
    } else {
      this.cancel();
    }
  }

  get intersecting() {
    return this.#intersecting;
  }

  get lastDay() {
    return this.days.at(-1);
  }

  getFirstAsset() {
    return this.days[0]?.getFirstAsset();
  }

  getAssets() {
    // eslint-disable-next-line unicorn/no-array-reduce
    return this.days.reduce((accumulator: TimelineAsset[], g: TimelineDay) => accumulator.concat(g.getAssets()), []);
  }

  sortDays() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.days.sort((a, b) => a.day - b.day);
    }

    return this.days.sort((a, b) => b.day - a.day);
  }

  runAssetOperation(ids: Set<string>, operation: AssetOperation) {
    if (ids.size === 0) {
      return {
        moveAssets: [] as TimelineAsset[],
        // eslint-disable-next-line svelte/prefer-svelte-reactivity
        processedIds: new Set<string>(),
        unprocessedIds: ids,
        changedGeometry: false,
      };
    }
    const { days } = this;
    let combinedChangedGeometry = false;
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const idsToProcess = new Set(ids);
    // eslint-disable-next-line svelte/prefer-svelte-reactivity
    const idsProcessed = new Set<string>();
    const combinedMoveAssets: TimelineAsset[] = [];
    let index = days.length;
    while (index--) {
      if (idsToProcess.size > 0) {
        const group = days[index];
        const { moveAssets, processedIds, changedGeometry } = group.runAssetOperation(ids, operation);
        if (moveAssets.length > 0) {
          combinedMoveAssets.push(...moveAssets);
        }
        setDifferenceInPlace(idsToProcess, processedIds);
        for (const id of processedIds) {
          idsProcessed.add(id);
        }
        combinedChangedGeometry = combinedChangedGeometry || changedGeometry;
        if (group.viewerAssets.length === 0) {
          days.splice(index, 1);
          combinedChangedGeometry = true;
        }
      }
    }
    return {
      moveAssets: combinedMoveAssets,
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
      this.addTimelineAsset(timelineAsset, addContext);
    }
    if (!preSorted) {
      for (const group of addContext.existingDays) {
        group.sortAssets(this.#sortOrder);
      }

      if (addContext.newDays.size > 0) {
        this.sortDays();
      }

      addContext.sort(this, this.#sortOrder);
    }
    return addContext.unprocessedAssets;
  }

  addTimelineAsset(timelineAsset: TimelineAsset, addContext: GroupInsertionCache) {
    const { localDateTime } = timelineAsset;

    const { year, month } = this.yearMonth;
    if (month !== localDateTime.month || year !== localDateTime.year) {
      addContext.unprocessedAssets.push(timelineAsset);
      return;
    }

    let day = addContext.getDay(localDateTime) || this.findDayByDay(localDateTime.day);
    if (day) {
      addContext.setDay(day, localDateTime);
    } else {
      const dayTitle = formatDayTitle(fromTimelinePlainDate(localDateTime));
      day = new TimelineDay(this, this.days.length, localDateTime.day, dayTitle);
      this.days.push(day);
      addContext.setDay(day, localDateTime);
      addContext.newDays.add(day);
    }

    const viewerAsset = new ViewerAsset(day, timelineAsset);
    day.viewerAssets.push(viewerAsset);
    addContext.changedDays.add(day);
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
    const prevMonth = timelineManager.months[index - 1];
    if (prevMonth) {
      const newTop = prevMonth.#top + prevMonth.#height;
      if (this.#top !== newTop) {
        this.#top = newTop;
      }
    }
    if (heightDelta === 0) {
      return;
    }
    for (let cursor = index + 1; cursor < timelineManager.months.length; cursor++) {
      const month = this.timelineManager.months[cursor];
      const newTop = month.#top + heightDelta;
      if (month.#top !== newTop) {
        month.#top = newTop;
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

  findDayForAsset(asset: TimelineAsset) {
    for (const group of this.days) {
      if (group.viewerAssets.some((viewerAsset) => viewerAsset.id === asset.id)) {
        return group;
      }
    }
  }

  findDayByDay(day: number) {
    return this.days.find((group) => group.day === day);
  }

  findAssetAbsolutePosition(assetId: string) {
    this.timelineManager.clearDeferredLayout(this);
    for (const group of this.days) {
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

  *assetsIterator(options?: { startDay?: TimelineDay; startAsset?: TimelineAsset; direction?: Direction }) {
    const direction = options?.direction ?? 'earlier';
    let { startAsset } = options ?? {};
    const isEarlier = direction === 'earlier';
    let groupIndex = options?.startDay ? this.days.indexOf(options.startDay) : isEarlier ? 0 : this.days.length - 1;

    while (groupIndex >= 0 && groupIndex < this.days.length) {
      const group = this.days[groupIndex];
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
