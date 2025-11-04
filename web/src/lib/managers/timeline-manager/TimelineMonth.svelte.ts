import { authManager } from '$lib/managers/auth-manager.svelte';
import { GroupInsertionCache } from '$lib/managers/timeline-manager/group-insertion-cache.svelte';
import { onCreateMonth } from '$lib/managers/timeline-manager/internal/TestHooks.svelte';
import { TimelineDay } from '$lib/managers/timeline-manager/TimelineDay.svelte';
import { TimelineManager } from '$lib/managers/timeline-manager/TimelineManager.svelte';
import type { AssetDescriptor, AssetOperation, Direction, TimelineAsset } from '$lib/managers/timeline-manager/types';
import { ViewerAsset } from '$lib/managers/timeline-manager/viewer-asset.svelte';
import { ScrollSegment, type SegmentIdentifier } from '$lib/managers/VirtualScrollManager/ScrollSegment.svelte';
import {
  formatDayTitle,
  formatDayTitleFull,
  formatMonthTitle,
  fromTimelinePlainDate,
  fromTimelinePlainDateTime,
  fromTimelinePlainYearMonth,
  getSegmentIdentifier,
  getTimes,
  setDifferenceInPlace,
  toISOYearMonthUTC,
  type TimelineDateTime,
  type TimelineYearMonth,
} from '$lib/utils/timeline-util';
import { AssetOrder, getTimeBucket, type TimeBucketAssetResponseDto } from '@immich/sdk';

export class TimelineMonth extends ScrollSegment {
  days: TimelineDay[] = $state([]);

  #sortOrder: AssetOrder = AssetOrder.Desc;
  #yearMonth: TimelineYearMonth;
  #identifier: SegmentIdentifier;
  #timelineManager: TimelineManager;

  readonly monthTitle: string;

  constructor(
    timelineManager: TimelineManager,
    yearMonth: TimelineYearMonth,
    initialCount: number,
    loaded: boolean,
    order: AssetOrder = AssetOrder.Desc,
  ) {
    super();
    this.initialCount = initialCount;
    this.#yearMonth = yearMonth;
    this.#identifier = getSegmentIdentifier(yearMonth);
    this.#timelineManager = timelineManager;
    this.#sortOrder = order;
    this.monthTitle = formatMonthTitle(fromTimelinePlainYearMonth(yearMonth));
    this.loaded = loaded;
    if (import.meta.env.DEV) {
      onCreateMonth(this);
    }
  }

  get identifier() {
    return this.#identifier;
  }

  get scrollManager(): TimelineManager {
    return this.#timelineManager;
  }

  get viewerAssets() {
    const assets: ViewerAsset[] = [];
    for (const day of this.days) {
      assets.push(...day.viewerAssets);
    }
    return assets;
  }

  override findAssetAbsolutePosition(assetId: string) {
    this.#clearDeferredLayout();
    for (const group of this.days) {
      const viewerAsset = group.viewerAssets.find((viewAsset) => viewAsset.id === assetId);
      if (viewerAsset) {
        if (!viewerAsset.position) {
          console.warn('No position for asset');
          return;
        }
        return {
          top: this.top + group.top + viewerAsset.position.top + this.scrollManager.headerHeight,
          height: viewerAsset.position.height,
        };
      }
    }
  }

  protected async fetch(signal: AbortSignal): Promise<unknown> {
    if (this.getFirstAsset()) {
      return;
    }
    const timelineManager = this.#timelineManager;
    const options = timelineManager.options;
    const timeBucket = toISOYearMonthUTC(this.yearMonth);
    const bucketResponse = await getTimeBucket(
      {
        ...authManager.params,
        ...options,
        timeBucket,
      },
      { signal },
    );

    if (!bucketResponse) {
      return;
    }

    if (options.timelineAlbumId) {
      const albumAssets = await getTimeBucket(
        {
          ...authManager.params,
          albumId: options.timelineAlbumId,
          timeBucket,
        },
        { signal },
      );
      for (const id of albumAssets.id) {
        timelineManager.albumAssets.add(id);
      }
    }

    const unprocessedAssets = this.addAssets(bucketResponse, true);
    if (unprocessedAssets.length > 0) {
      console.error(
        `Warning: getTimeBucket API returning assets not in requested month: ${this.yearMonth.month}, ${JSON.stringify(
          unprocessedAssets.map((unprocessed) => ({
            id: unprocessed.id,
            localDateTime: unprocessed.localDateTime,
          })),
        )}`,
      );
    }
  }

  override layout(noDefer: boolean) {
    let cumulativeHeight = 0;
    let cumulativeWidth = 0;
    let currentRowHeight = 0;

    let dayRow = 0;
    let dayCol = 0;

    const options = this.scrollManager.justifiedLayoutOptions;
    for (const day of this.days) {
      day.layout(options, noDefer);

      // Calculate space needed for this item (including gap if not first in row)
      const spaceNeeded = day.width + (dayCol > 0 ? this.scrollManager.gap : 0);
      const fitsInCurrentRow = cumulativeWidth + spaceNeeded <= this.scrollManager.viewportWidth;

      if (fitsInCurrentRow) {
        day.row = dayRow;
        day.col = dayCol++;
        day.left = cumulativeWidth;
        day.top = cumulativeHeight;

        cumulativeWidth += day.width + this.scrollManager.gap;
      } else {
        // Move to next row
        cumulativeHeight += currentRowHeight;
        cumulativeWidth = 0;
        dayRow++;
        dayCol = 0;

        // Position at start of new row
        day.row = dayRow;
        day.col = dayCol;
        day.left = 0;
        day.top = cumulativeHeight;

        dayCol++;
        cumulativeWidth += day.width + this.scrollManager.gap;
      }
      currentRowHeight = day.height + this.scrollManager.headerHeight;
    }

    // Add the height of the final row
    cumulativeHeight += currentRowHeight;

    this.height = cumulativeHeight;
    this.isHeightActual = true;
  }

  override updateIntersection({
    intersecting,
    actuallyIntersecting,
  }: {
    intersecting: boolean;
    actuallyIntersecting: boolean;
  }) {
    super.updateIntersection({ intersecting, actuallyIntersecting });
    if (intersecting) {
      this.#clearDeferredLayout();
    }
  }

  get yearMonth() {
    return this.#yearMonth;
  }

  get lastDay() {
    return this.days.at(-1);
  }

  getFirstAsset() {
    return this.days[0]?.getFirstAsset();
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

  sortDays() {
    if (this.#sortOrder === AssetOrder.Asc) {
      return this.days.sort((a, b) => a.day - b.day);
    }

    return this.days.sort((a, b) => b.day - a.day);
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
      const dayTitleFull = formatDayTitleFull(fromTimelinePlainDate(localDateTime));
      day = new TimelineDay(this, this.days.length, localDateTime.day, dayTitle, dayTitleFull);
      this.days.push(day);
      addContext.setDay(day, localDateTime);
      addContext.newDays.add(day);
    }

    const viewerAsset = new ViewerAsset(day, timelineAsset);
    day.viewerAssets.push(viewerAsset);
    addContext.changedDays.add(day);
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

  #clearDeferredLayout() {
    const hasDeferred = this.days.some((group) => group.deferredLayout);
    if (hasDeferred) {
      this.updateGeometry({ invalidateHeight: true, noDefer: true });
      for (const group of this.days) {
        group.deferredLayout = false;
      }
    }
  }
}
