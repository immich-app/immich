<script lang="ts">
  import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
  import { page } from '$app/stores';
  import { resizeObserver, type OnResizeCallback } from '$lib/actions/resize-observer';
  import { shortcuts, type ShortcutOptions } from '$lib/actions/shortcut';
  import type { Action } from '$lib/components/asset-viewer/actions/action';
  import {
    setFocusToAsset as setFocusAssetInit,
    setFocusTo as setFocusToInit,
  } from '$lib/components/photos-page/actions/focus-actions';
  import Skeleton from '$lib/components/photos-page/skeleton.svelte';
  import ChangeDate from '$lib/components/shared-components/change-date.svelte';
  import Scrubber from '$lib/components/shared-components/scrubber/scrubber.svelte';
  import { AppRoute, AssetAction } from '$lib/constants';
  import { authManager } from '$lib/managers/auth-manager.svelte';
  import type { DayGroup } from '$lib/managers/timeline-manager/day-group.svelte';
  import type { MonthGroup } from '$lib/managers/timeline-manager/month-group.svelte';
  import { TimelineManager } from '$lib/managers/timeline-manager/timeline-manager.svelte';
  import type { TimelineAsset } from '$lib/managers/timeline-manager/types';
  import { assetsSnapshot } from '$lib/managers/timeline-manager/utils.svelte';
  import ShortcutsModal from '$lib/modals/ShortcutsModal.svelte';
  import type { AssetInteraction } from '$lib/stores/asset-interaction.svelte';
  import { assetViewingStore } from '$lib/stores/asset-viewing.store';
  import { isSelectingAllAssets } from '$lib/stores/assets-store.svelte';
  import { mobileDevice } from '$lib/stores/mobile-device.svelte';
  import { showDeleteModal } from '$lib/stores/preferences.store';
  import { searchStore } from '$lib/stores/search.svelte';
  import { featureFlags } from '$lib/stores/server-config.store';
  import { handlePromiseError } from '$lib/utils';
  import { deleteAssets, updateStackedAssetInTimeline, updateUnstackedAssetInTimeline } from '$lib/utils/actions';
  import { archiveAssets, cancelMultiselect, selectAllAssets, stackAssets } from '$lib/utils/asset-utils';
  import { navigate } from '$lib/utils/navigation';
  import { getTimes, toTimelineAsset, type ScrubberListener, type TimelineYearMonth } from '$lib/utils/timeline-util';
  import { AssetVisibility, getAssetInfo, type AlbumResponseDto, type PersonResponseDto } from '@immich/sdk';
  import { modalManager } from '@immich/ui';
  import { DateTime } from 'luxon';
  import { onMount, type Snippet } from 'svelte';
  import type { UpdatePayload } from 'vite';
  import Portal from '../shared-components/portal/portal.svelte';
  import AssetDateGroup from './asset-date-group.svelte';
  import DeleteAssetDialog from './delete-asset-dialog.svelte';

  interface Props {
    isSelectionMode?: boolean;
    singleSelect?: boolean;
    /** `true` if this asset grid is responds to navigation events; if `true`, then look at the
     `AssetViewingStore.gridScrollTarget` and load and scroll to the asset specified, and
     additionally, update the page location/url with the asset as the asset-grid is scrolled */
    enableRouting: boolean;
    timelineManager: TimelineManager;
    assetInteraction: AssetInteraction;
    removeAction?:
      | AssetAction.UNARCHIVE
      | AssetAction.ARCHIVE
      | AssetAction.FAVORITE
      | AssetAction.UNFAVORITE
      | AssetAction.SET_VISIBILITY_TIMELINE
      | null;
    withStacked?: boolean;
    showArchiveIcon?: boolean;
    isShared?: boolean;
    album?: AlbumResponseDto | null;
    person?: PersonResponseDto | null;
    isShowDeleteConfirmation?: boolean;
    onSelect?: (asset: TimelineAsset) => void;
    onEscape?: () => void;
    children?: Snippet;
    empty?: Snippet;
    customLayout?: Snippet<[TimelineAsset]>;
    onThumbnailClick?: (
      asset: TimelineAsset,
      timelineManager: TimelineManager,
      dayGroup: DayGroup,
      onClick: (
        timelineManager: TimelineManager,
        assets: TimelineAsset[],
        groupTitle: string,
        asset: TimelineAsset,
      ) => void,
    ) => void;
  }

  let {
    isSelectionMode = false,
    singleSelect = false,
    enableRouting,
    timelineManager = $bindable(),
    assetInteraction,
    removeAction = null,
    withStacked = false,
    showArchiveIcon = false,
    isShared = false,
    album = null,
    person = null,
    isShowDeleteConfirmation = $bindable(false),
    onSelect = () => {},
    onEscape = () => {},
    children,
    empty,
    customLayout,
    onThumbnailClick,
  }: Props = $props();

  let { isViewing: showAssetViewer, asset: viewingAsset, preloadAssets, gridScrollTarget, mutex } = assetViewingStore;

  let element: HTMLElement | undefined = $state();

  let timelineElement: HTMLElement | undefined = $state();
  let showSkeleton = $state(true);
  let isShowSelectDate = $state(false);
  let scrubberMonthPercent = $state(0);
  let scrubberMonth: { year: number; month: number } | undefined = $state(undefined);
  let scrubOverallPercent: number = $state(0);
  let scrubberWidth = $state(0);

  // 60 is the bottom spacer element at 60px
  let bottomSectionHeight = 60;
  let leadout = $state(false);

  const maxMd = $derived(mobileDevice.maxMd);
  const usingMobileDevice = $derived(mobileDevice.pointerCoarse);

  $effect(() => {
    const layoutOptions = maxMd
      ? {
          rowHeight: 100,
          headerHeight: 32,
        }
      : {
          rowHeight: 235,
          headerHeight: 48,
        };
    timelineManager.setLayoutOptions(layoutOptions);
  });

  const scrollTo = (top: number) => {
    if (element) {
      element.scrollTo({ top });
    }
  };
  const scrollTop = (top: number) => {
    if (element) {
      element.scrollTop = top;
    }
  };
  const scrollBy = (y: number) => {
    if (element) {
      element.scrollBy(0, y);
    }
  };
  const scrollToTop = () => {
    scrollTo(0);
  };

  const getAssetHeight = (assetId: string, monthGroup: MonthGroup) => {
    // the following method may trigger any layouts, so need to
    // handle any scroll compensation that may have been set
    const height = monthGroup!.findAssetAbsolutePosition(assetId);

    while (timelineManager.scrollCompensation.monthGroup) {
      handleScrollCompensation(timelineManager.scrollCompensation);
      timelineManager.clearScrollCompensation();
    }
    return height;
  };

  const assetIsVisible = (assetTop: number): boolean => {
    if (!element) {
      return false;
    }

    const { clientHeight, scrollTop } = element;
    return assetTop >= scrollTop && assetTop < scrollTop + clientHeight;
  };

  const scrollToAssetId = async (assetId: string) => {
    const monthGroup = await timelineManager.findMonthGroupForAsset(assetId);
    if (!monthGroup) {
      return false;
    }

    const height = getAssetHeight(assetId, monthGroup);

    // If the asset is already visible, then don't scroll.
    if (assetIsVisible(height)) {
      return true;
    }

    scrollTo(height);
    updateSlidingWindow();
    return true;
  };

  const scrollToAsset = (asset: TimelineAsset) => {
    const monthGroup = timelineManager.getMonthGroupByAssetId(asset.id);
    if (!monthGroup) {
      return false;
    }
    const height = getAssetHeight(asset.id, monthGroup);
    scrollTo(height);
    updateSlidingWindow();
    return true;
  };

  const completeNav = async () => {
    const scrollTarget = $gridScrollTarget?.at;
    let scrolled = false;
    if (scrollTarget) {
      scrolled = await scrollToAssetId(scrollTarget);
    }
    if (!scrolled) {
      // if the asset is not found, scroll to the top
      scrollToTop();
    }
    showSkeleton = false;
  };

  beforeNavigate(() => (timelineManager.suspendTransitions = true));

  afterNavigate((nav) => {
    const { complete } = nav;
    complete.then(completeNav, completeNav);
  });

  const hmrSupport = () => {
    // when hmr happens, skeleton is initialized to true by default
    // normally, loading asset-grid is part of a navigation event, and the completion of
    // that event triggers a scroll-to-asset, if necessary, when then clears the skeleton.
    // this handler will run the navigation/scroll-to-asset handler when hmr is performed,
    // preventing skeleton from showing after hmr
    if (import.meta && import.meta.hot) {
      const afterApdate = (payload: UpdatePayload) => {
        const assetGridUpdate = payload.updates.some(
          (update) => update.path.endsWith('asset-grid.svelte') || update.path.endsWith('assets-store.ts'),
        );

        if (assetGridUpdate) {
          setTimeout(() => {
            const asset = $page.url.searchParams.get('at');
            if (asset) {
              $gridScrollTarget = { at: asset };
              void navigate(
                { targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget },
                { replaceState: true, forceNavigate: true },
              );
            } else {
              scrollToTop();
            }
            showSkeleton = false;
          }, 500);
        }
      };
      import.meta.hot?.on('vite:afterUpdate', afterApdate);
      import.meta.hot?.on('vite:beforeUpdate', (payload) => {
        const assetGridUpdate = payload.updates.some((update) => update.path.endsWith('asset-grid.svelte'));
        if (assetGridUpdate) {
          timelineManager.destroy();
        }
      });

      return () => import.meta.hot?.off('vite:afterUpdate', afterApdate);
    }
    return () => void 0;
  };

  const updateIsScrolling = () => (timelineManager.scrolling = true);
  // note: don't throttle, debounch, or otherwise do this function async - it causes flicker
  const updateSlidingWindow = () => timelineManager.updateSlidingWindow(element?.scrollTop || 0);

  const handleScrollCompensation = ({ heightDelta, scrollTop }: { heightDelta?: number; scrollTop?: number }) => {
    if (heightDelta !== undefined) {
      scrollBy(heightDelta);
    } else if (scrollTop !== undefined) {
      scrollTo(scrollTop);
    }
    // Yes, updateSlideWindow() is called by the onScroll event triggered as a result of
    // the above calls. However, this delay is enough time to set the intersecting property
    // of the monthGroup to false, then true, which causes the DOM nodes to be recreated,
    // causing bad perf, and also, disrupting focus of those elements.
    updateSlidingWindow();
  };

  const topSectionResizeObserver: OnResizeCallback = ({ height }) => (timelineManager.topSectionHeight = height);

  onMount(() => {
    if (!enableRouting) {
      showSkeleton = false;
    }
    const disposeHmr = hmrSupport();
    return () => {
      disposeHmr();
    };
  });

  const getMaxScrollPercent = () => {
    const totalHeight = timelineManager.timelineHeight + bottomSectionHeight + timelineManager.topSectionHeight;
    return (totalHeight - timelineManager.viewportHeight) / totalHeight;
  };

  const getMaxScroll = () => {
    if (!element || !timelineElement) {
      return 0;
    }
    return (
      timelineManager.topSectionHeight + bottomSectionHeight + (timelineElement.clientHeight - element.clientHeight)
    );
  };

  const scrollToMonthGroupAndOffset = (monthGroup: MonthGroup, monthGroupScrollPercent: number) => {
    const topOffset = monthGroup.top;
    const maxScrollPercent = getMaxScrollPercent();
    const delta = monthGroup.height * monthGroupScrollPercent;
    const scrollToTop = (topOffset + delta) * maxScrollPercent;

    scrollTop(scrollToTop);
  };

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  const onScrub: ScrubberListener = (
    scrubMonth: { year: number; month: number },
    overallScrollPercent: number,
    scrubberMonthScrollPercent: number,
  ) => {
    if (!scrubMonth || timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust - use use the overall percent instead
      const maxScroll = getMaxScroll();
      const offset = maxScroll * overallScrollPercent;
      scrollTop(offset);
    } else {
      const monthGroup = timelineManager.months.find(
        ({ yearMonth: { year, month } }) => year === scrubMonth.year && month === scrubMonth.month,
      );
      if (!monthGroup) {
        return;
      }
      scrollToMonthGroupAndOffset(monthGroup, scrubberMonthScrollPercent);
    }
  };

  // note: don't throttle, debounch, or otherwise make this function async - it causes flicker
  const handleTimelineScroll = () => {
    leadout = false;

    if (!element) {
      return;
    }

    if (timelineManager.timelineHeight < timelineManager.viewportHeight * 2) {
      // edge case - scroll limited due to size of content, must adjust -  use the overall percent instead
      const maxScroll = getMaxScroll();
      scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);

      scrubberMonth = undefined;
      scrubberMonthPercent = 0;
    } else {
      let top = element.scrollTop;
      if (top < timelineManager.topSectionHeight) {
        // in the lead-in area
        scrubberMonth = undefined;
        scrubberMonthPercent = 0;
        const maxScroll = getMaxScroll();

        scrubOverallPercent = Math.min(1, element.scrollTop / maxScroll);
        return;
      }

      let maxScrollPercent = getMaxScrollPercent();
      let found = false;

      const monthsLength = timelineManager.months.length;
      for (let i = -1; i < monthsLength + 1; i++) {
        let monthGroup: TimelineYearMonth | undefined;
        let monthGroupHeight = 0;
        if (i === -1) {
          // lead-in
          monthGroupHeight = timelineManager.topSectionHeight;
        } else if (i === monthsLength) {
          // lead-out
          monthGroupHeight = bottomSectionHeight;
        } else {
          monthGroup = timelineManager.months[i].yearMonth;
          monthGroupHeight = timelineManager.months[i].height;
        }

        let next = top - monthGroupHeight * maxScrollPercent;
        // instead of checking for < 0, add a little wiggle room for subpixel resolution
        if (next < -1 && monthGroup) {
          scrubberMonth = monthGroup;

          // allowing next to be at least 1 may cause percent to go negative, so ensure positive percentage
          scrubberMonthPercent = Math.max(0, top / (monthGroupHeight * maxScrollPercent));

          // compensate for lost precision/rounding errors advance to the next bucket, if present
          if (scrubberMonthPercent > 0.9999 && i + 1 < monthsLength - 1) {
            scrubberMonth = timelineManager.months[i + 1].yearMonth;
            scrubberMonthPercent = 0;
          }

          found = true;
          break;
        }
        top = next;
      }
      if (!found) {
        leadout = true;
        scrubberMonth = undefined;
        scrubberMonthPercent = 0;
        scrubOverallPercent = 1;
      }
    }
  };

  const trashOrDelete = async (force: boolean = false) => {
    isShowDeleteConfirmation = false;
    await deleteAssets(
      !(isTrashEnabled && !force),
      (assetIds) => timelineManager.removeAssets(assetIds),
      assetInteraction.selectedAssets,
      !isTrashEnabled || force ? undefined : (assets) => timelineManager.addAssets(assets),
    );
    assetInteraction.clearMultiselect();
  };

  const onDelete = () => {
    const hasTrashedAsset = assetInteraction.selectedAssets.some((asset) => asset.isTrashed);

    if ($showDeleteModal && (!isTrashEnabled || hasTrashedAsset)) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(hasTrashedAsset));
  };

  const onForceDelete = () => {
    if ($showDeleteModal) {
      isShowDeleteConfirmation = true;
      return;
    }
    handlePromiseError(trashOrDelete(true));
  };

  const onStackAssets = async () => {
    const result = await stackAssets(assetInteraction.selectedAssets);

    updateStackedAssetInTimeline(timelineManager, result);

    onEscape();
  };

  const toggleArchive = async () => {
    const visibility = assetInteraction.isAllArchived ? AssetVisibility.Timeline : AssetVisibility.Archive;
    const ids = await archiveAssets(assetInteraction.selectedAssets, visibility);
    timelineManager.updateAssetOperation(ids, (asset) => {
      asset.visibility = visibility;
      return { remove: false };
    });
    deselectAllAssets();
  };

  const handleSelectAsset = (asset: TimelineAsset) => {
    if (!timelineManager.albumAssets.has(asset.id)) {
      assetInteraction.selectAsset(asset);
    }
  };

  const handlePrevious = async () => {
    const release = await mutex.acquire();
    const laterAsset = await timelineManager.getLaterAsset($viewingAsset);

    if (laterAsset) {
      const preloadAsset = await timelineManager.getLaterAsset(laterAsset);
      const asset = await getAssetInfo({ ...authManager.params, id: laterAsset.id });
      assetViewingStore.setAsset(asset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: laterAsset.id });
    }

    release();
    return !!laterAsset;
  };

  const handleNext = async () => {
    const release = await mutex.acquire();
    const earlierAsset = await timelineManager.getEarlierAsset($viewingAsset);

    if (earlierAsset) {
      const preloadAsset = await timelineManager.getEarlierAsset(earlierAsset);
      const asset = await getAssetInfo({ ...authManager.params, id: earlierAsset.id });
      assetViewingStore.setAsset(asset, preloadAsset ? [preloadAsset] : []);
      await navigate({ targetRoute: 'current', assetId: earlierAsset.id });
    }

    release();
    return !!earlierAsset;
  };

  const handleRandom = async () => {
    const randomAsset = await timelineManager.getRandomAsset();

    if (randomAsset) {
      const asset = await getAssetInfo({ ...authManager.params, id: randomAsset.id });
      assetViewingStore.setAsset(asset);
      await navigate({ targetRoute: 'current', assetId: randomAsset.id });
      return asset;
    }
  };

  const handleClose = async (asset: { id: string }) => {
    assetViewingStore.showAssetViewer(false);
    showSkeleton = true;
    $gridScrollTarget = { at: asset.id };
    await navigate({ targetRoute: 'current', assetId: null, assetGridRouteSearchParams: $gridScrollTarget });
  };

  const handlePreAction = async (action: Action) => {
    switch (action.type) {
      case removeAction:
      case AssetAction.TRASH:
      case AssetAction.RESTORE:
      case AssetAction.DELETE:
      case AssetAction.ARCHIVE:
      case AssetAction.SET_VISIBILITY_LOCKED:
      case AssetAction.SET_VISIBILITY_TIMELINE: {
        // find the next asset to show or close the viewer
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        (await handleNext()) || (await handlePrevious()) || (await handleClose(action.asset));

        // delete after find the next one
        timelineManager.removeAssets([action.asset.id]);
        break;
      }
    }
  };
  const handleAction = (action: Action) => {
    switch (action.type) {
      case AssetAction.ARCHIVE:
      case AssetAction.UNARCHIVE:
      case AssetAction.FAVORITE:
      case AssetAction.UNFAVORITE: {
        timelineManager.updateAssets([action.asset]);
        break;
      }

      case AssetAction.ADD: {
        timelineManager.addAssets([action.asset]);
        break;
      }

      case AssetAction.UNSTACK: {
        updateUnstackedAssetInTimeline(timelineManager, action.assets);
        break;
      }
      case AssetAction.REMOVE_ASSET_FROM_STACK: {
        timelineManager.addAssets([toTimelineAsset(action.asset)]);
        if (action.stack) {
          //Have to unstack then restack assets in timeline in order to update the stack count in the timeline.
          updateUnstackedAssetInTimeline(
            timelineManager,
            action.stack.assets.map((asset) => toTimelineAsset(asset)),
          );
          updateStackedAssetInTimeline(timelineManager, {
            stack: action.stack,
            toDeleteIds: action.stack.assets
              .filter((asset) => asset.id !== action.stack?.primaryAssetId)
              .map((asset) => asset.id),
          });
        }
        break;
      }
      case AssetAction.SET_STACK_PRIMARY_ASSET: {
        //Have to unstack then restack assets in timeline in order for the currently removed new primary asset to be made visible.
        updateUnstackedAssetInTimeline(
          timelineManager,
          action.stack.assets.map((asset) => toTimelineAsset(asset)),
        );
        updateStackedAssetInTimeline(timelineManager, {
          stack: action.stack,
          toDeleteIds: action.stack.assets
            .filter((asset) => asset.id !== action.stack.primaryAssetId)
            .map((asset) => asset.id),
        });
        break;
      }
    }
  };

  let lastAssetMouseEvent: TimelineAsset | null = $state(null);

  let shiftKeyIsDown = $state(false);

  const deselectAllAssets = () => {
    cancelMultiselect(assetInteraction);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = true;
    }
  };

  const onKeyUp = (event: KeyboardEvent) => {
    if (searchStore.isSearchEnabled) {
      return;
    }

    if (event.key === 'Shift') {
      event.preventDefault();
      shiftKeyIsDown = false;
    }
  };

  const handleSelectAssetCandidates = (asset: TimelineAsset | null) => {
    if (asset) {
      void selectAssetCandidates(asset);
    }
    lastAssetMouseEvent = asset;
  };

  const handleGroupSelect = (timelineManager: TimelineManager, group: string, assets: TimelineAsset[]) => {
    if (assetInteraction.selectedGroup.has(group)) {
      assetInteraction.removeGroupFromMultiselectGroup(group);
      for (const asset of assets) {
        assetInteraction.removeAssetFromMultiselectGroup(asset.id);
      }
    } else {
      assetInteraction.addGroupToMultiselectGroup(group);
      for (const asset of assets) {
        handleSelectAsset(asset);
      }
    }

    if (timelineManager.assetCount == assetInteraction.selectedAssets.length) {
      isSelectingAllAssets.set(true);
    } else {
      isSelectingAllAssets.set(false);
    }
  };

  const handleSelectAssets = async (asset: TimelineAsset) => {
    if (!asset) {
      return;
    }
    onSelect(asset);

    if (singleSelect) {
      scrollTop(0);
      return;
    }

    const rangeSelection = assetInteraction.assetSelectionCandidates.length > 0;
    const deselect = assetInteraction.hasSelectedAsset(asset.id);

    // Select/deselect already loaded assets
    if (deselect) {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        assetInteraction.removeAssetFromMultiselectGroup(candidate.id);
      }
      assetInteraction.removeAssetFromMultiselectGroup(asset.id);
    } else {
      for (const candidate of assetInteraction.assetSelectionCandidates) {
        handleSelectAsset(candidate);
      }
      handleSelectAsset(asset);
    }

    assetInteraction.clearAssetSelectionCandidates();

    if (assetInteraction.assetSelectionStart && rangeSelection) {
      let startBucket = timelineManager.getMonthGroupByAssetId(assetInteraction.assetSelectionStart.id);
      let endBucket = timelineManager.getMonthGroupByAssetId(asset.id);

      if (startBucket === null || endBucket === null) {
        return;
      }

      // Select/deselect assets in range (start,end)
      let started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === endBucket) {
          break;
        }
        if (started) {
          await timelineManager.loadMonthGroup(monthGroup.yearMonth);
          for (const asset of monthGroup.assetsIterator()) {
            if (deselect) {
              assetInteraction.removeAssetFromMultiselectGroup(asset.id);
            } else {
              handleSelectAsset(asset);
            }
          }
        }
        if (monthGroup === startBucket) {
          started = true;
        }
      }

      // Update date group selection in range [start,end]
      started = false;
      for (const monthGroup of timelineManager.months) {
        if (monthGroup === startBucket) {
          started = true;
        }
        if (started) {
          // Split month group into day groups and check each group
          for (const dayGroup of monthGroup.dayGroups) {
            const dayGroupTitle = dayGroup.groupTitle;
            if (dayGroup.getAssets().every((a) => assetInteraction.hasSelectedAsset(a.id))) {
              assetInteraction.addGroupToMultiselectGroup(dayGroupTitle);
            } else {
              assetInteraction.removeGroupFromMultiselectGroup(dayGroupTitle);
            }
          }
        }
        if (monthGroup === endBucket) {
          break;
        }
      }
    }

    assetInteraction.setAssetSelectionStart(deselect ? null : asset);
  };

  const selectAssetCandidates = async (endAsset: TimelineAsset) => {
    if (!shiftKeyIsDown) {
      return;
    }

    const startAsset = assetInteraction.assetSelectionStart;
    if (!startAsset) {
      return;
    }

    const assets = assetsSnapshot(await timelineManager.retrieveRange(startAsset, endAsset));
    assetInteraction.setAssetSelectionCandidates(assets);
  };

  const onSelectStart = (e: Event) => {
    if (assetInteraction.selectionActive && shiftKeyIsDown) {
      e.preventDefault();
    }
  };

  let isTrashEnabled = $derived($featureFlags.loaded && $featureFlags.trash);
  let isEmpty = $derived(timelineManager.isInitialized && timelineManager.months.length === 0);
  let idsSelectedAssets = $derived(assetInteraction.selectedAssets.map(({ id }) => id));
  let isShortcutModalOpen = false;

  const handleOpenShortcutModal = async () => {
    if (isShortcutModalOpen) {
      return;
    }

    isShortcutModalOpen = true;
    await modalManager.show(ShortcutsModal, {});
    isShortcutModalOpen = false;
  };

  $effect(() => {
    if (isEmpty) {
      assetInteraction.clearMultiselect();
    }
  });

  const setFocusTo = setFocusToInit.bind(undefined, scrollToAsset, timelineManager);
  const setFocusAsset = setFocusAssetInit.bind(undefined, scrollToAsset);

  let shortcutList = $derived(
    (() => {
      if (searchStore.isSearchEnabled || $showAssetViewer) {
        return [];
      }

      const shortcuts: ShortcutOptions[] = [
        { shortcut: { key: 'Escape' }, onShortcut: onEscape },
        { shortcut: { key: '?', shift: true }, onShortcut: handleOpenShortcutModal },
        { shortcut: { key: '/' }, onShortcut: () => goto(AppRoute.EXPLORE) },
        { shortcut: { key: 'A', ctrl: true }, onShortcut: () => selectAllAssets(timelineManager, assetInteraction) },
        { shortcut: { key: 'ArrowRight' }, onShortcut: () => setFocusTo('earlier', 'asset') },
        { shortcut: { key: 'ArrowLeft' }, onShortcut: () => setFocusTo('later', 'asset') },
        { shortcut: { key: 'D' }, onShortcut: () => setFocusTo('earlier', 'day') },
        { shortcut: { key: 'D', shift: true }, onShortcut: () => setFocusTo('later', 'day') },
        { shortcut: { key: 'M' }, onShortcut: () => setFocusTo('earlier', 'month') },
        { shortcut: { key: 'M', shift: true }, onShortcut: () => setFocusTo('later', 'month') },
        { shortcut: { key: 'Y' }, onShortcut: () => setFocusTo('earlier', 'year') },
        { shortcut: { key: 'Y', shift: true }, onShortcut: () => setFocusTo('later', 'year') },
        { shortcut: { key: 'G' }, onShortcut: () => (isShowSelectDate = true) },
      ];

      if (assetInteraction.selectionActive) {
        shortcuts.push(
          { shortcut: { key: 'Delete' }, onShortcut: onDelete },
          { shortcut: { key: 'Delete', shift: true }, onShortcut: onForceDelete },
          { shortcut: { key: 'D', ctrl: true }, onShortcut: () => deselectAllAssets() },
          { shortcut: { key: 's' }, onShortcut: () => onStackAssets() },
          { shortcut: { key: 'a', shift: true }, onShortcut: toggleArchive },
        );
      }

      return shortcuts;
    })(),
  );

  $effect(() => {
    if (!lastAssetMouseEvent) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (!shiftKeyIsDown) {
      assetInteraction.clearAssetSelectionCandidates();
    }
  });

  $effect(() => {
    if (shiftKeyIsDown && lastAssetMouseEvent) {
      void selectAssetCandidates(lastAssetMouseEvent);
    }
  });

  $effect(() => {
    if ($showAssetViewer) {
      const { localDateTime } = getTimes($viewingAsset.fileCreatedAt, DateTime.local().offset / 60);
      void timelineManager.loadMonthGroup({ year: localDateTime.year, month: localDateTime.month });
    }
  });
</script>

<svelte:document onkeydown={onKeyDown} onkeyup={onKeyUp} onselectstart={onSelectStart} use:shortcuts={shortcutList} />

{#if isShowDeleteConfirmation}
  <DeleteAssetDialog
    size={idsSelectedAssets.length}
    onCancel={() => (isShowDeleteConfirmation = false)}
    onConfirm={() => handlePromiseError(trashOrDelete(true))}
  />
{/if}

{#if isShowSelectDate}
  <ChangeDate
    title="Navigate to Time"
    initialDate={DateTime.now()}
    timezoneInput={false}
    onConfirm={async (dateString: string) => {
      isShowSelectDate = false;
      const asset = await timelineManager.getClosestAssetToDate(
        (DateTime.fromISO(dateString) as DateTime<true>).toObject(),
      );
      if (asset) {
        setFocusAsset(asset);
      }
    }}
    onCancel={() => (isShowSelectDate = false)}
  />
{/if}

{#if timelineManager.months.length > 0}
  <Scrubber
    {timelineManager}
    height={timelineManager.viewportHeight}
    timelineTopOffset={timelineManager.topSectionHeight}
    timelineBottomOffset={bottomSectionHeight}
    {leadout}
    {scrubOverallPercent}
    {scrubberMonthPercent}
    {scrubberMonth}
    {onScrub}
    bind:scrubberWidth
    onScrubKeyDown={(evt) => {
      evt.preventDefault();
      let amount = 50;
      if (shiftKeyIsDown) {
        amount = 500;
      }
      if (evt.key === 'ArrowUp') {
        amount = -amount;
        if (shiftKeyIsDown) {
          element?.scrollBy({ top: amount, behavior: 'smooth' });
        }
      } else if (evt.key === 'ArrowDown') {
        element?.scrollBy({ top: amount, behavior: 'smooth' });
      }
    }}
  />
{/if}

<!-- Right margin MUST be equal to the width of scrubber -->
<section
  id="asset-grid"
  class={['scrollbar-hidden h-full overflow-y-auto outline-none', { 'm-0': isEmpty }, { 'ms-0': !isEmpty }]}
  style:margin-right={(usingMobileDevice ? 0 : scrubberWidth) + 'px'}
  tabindex="-1"
  bind:clientHeight={timelineManager.viewportHeight}
  bind:clientWidth={null, (v: number) => ((timelineManager.viewportWidth = v), updateSlidingWindow())}
  bind:this={element}
  onscroll={() => (handleTimelineScroll(), updateSlidingWindow(), updateIsScrolling())}
>
  <section
    bind:this={timelineElement}
    id="virtual-timeline"
    class:invisible={showSkeleton}
    style:height={timelineManager.timelineHeight + 'px'}
  >
    <section
      use:resizeObserver={topSectionResizeObserver}
      class:invisible={showSkeleton}
      style:position="absolute"
      style:left="0"
      style:right="0"
    >
      {@render children?.()}
      {#if isEmpty}
        <!-- (optional) empty placeholder -->
        {@render empty?.()}
      {/if}
    </section>

    {#each timelineManager.months as monthGroup (monthGroup.viewId)}
      {@const display = monthGroup.intersecting}
      {@const absoluteHeight = monthGroup.top}

      {#if !monthGroup.isLoaded}
        <div
          style:height={monthGroup.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <Skeleton
            height={monthGroup.height - monthGroup.timelineManager.headerHeight}
            title={monthGroup.monthGroupTitle}
          />
        </div>
      {:else if display}
        <div
          class="month-group"
          style:height={monthGroup.height + 'px'}
          style:position="absolute"
          style:transform={`translate3d(0,${absoluteHeight}px,0)`}
          style:width="100%"
        >
          <AssetDateGroup
            {withStacked}
            {showArchiveIcon}
            {assetInteraction}
            {timelineManager}
            {isSelectionMode}
            {singleSelect}
            {monthGroup}
            onSelect={({ title, assets }) => handleGroupSelect(timelineManager, title, assets)}
            onSelectAssetCandidates={handleSelectAssetCandidates}
            onSelectAssets={handleSelectAssets}
            onScrollCompensation={handleScrollCompensation}
            {customLayout}
            {onThumbnailClick}
          />
        </div>
      {/if}
    {/each}
    <!-- spacer for leadout -->
    <div
      class="h-[60px]"
      style:position="absolute"
      style:left="0"
      style:right="0"
      style:transform={`translate3d(0,${timelineManager.timelineHeight}px,0)`}
    ></div>
  </section>
</section>

<Portal target="body">
  {#if $showAssetViewer}
    {#await import('../asset-viewer/asset-viewer.svelte') then { default: AssetViewer }}
      <AssetViewer
        {withStacked}
        asset={$viewingAsset}
        preloadAssets={$preloadAssets}
        {isShared}
        {album}
        {person}
        preAction={handlePreAction}
        onAction={handleAction}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onRandom={handleRandom}
        onClose={handleClose}
      />
    {/await}
  {/if}
</Portal>

<style>
  #asset-grid {
    contain: strict;
    scrollbar-width: none;
  }

  .month-group {
    contain: layout size paint;
    transform-style: flat;
    backface-visibility: hidden;
    transform-origin: center center;
  }
</style>
