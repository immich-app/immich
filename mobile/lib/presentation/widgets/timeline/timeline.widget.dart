import 'dart:async';
import 'dart:collection';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_status_floating_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/metadata.provider.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/selection_sliver_app_bar.dart';
import 'package:intl/intl.dart' hide TextDirection;

// Fraction of the raw two-finger pinch ratio applied to the zoom z-axis. < 1
// means the user has to pinch further to traverse a stop, for finer control.
const double _kPinchDampening = 0.65;

class Timeline extends StatelessWidget {
  const Timeline({
    super.key,
    this.topSliverWidget,
    this.topSliverWidgetHeight,
    this.bottomSliverWidget,
    this.showStorageIndicator = false,
    this.withStack = false,
    this.appBar = const ImmichSliverAppBar(floating: true, pinned: false, snap: false),
    this.bottomSheet = const GeneralBottomSheet(minChildSize: 0.23),
    this.groupBy,
    this.withScrubber = true,
    this.snapToMonth = true,
    this.readOnly = false,
    this.persistentBottomBar = false,
    this.loadingWidget,
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final Widget? bottomSliverWidget;
  final bool showStorageIndicator;
  final Widget? appBar;
  final Widget? bottomSheet;
  final bool withStack;
  final GroupAssetsBy? groupBy;
  final bool withScrubber;
  final bool snapToMonth;
  final bool readOnly;
  final bool persistentBottomBar;
  final Widget? loadingWidget;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (_, constraints) => ProviderScope(
        overrides: [
          timelineArgsProvider.overrideWith(
            (ref) => TimelineArgs(
              maxWidth: constraints.maxWidth,
              maxHeight: constraints.maxHeight,
              columnCount:
                  ref.watch(pinchZoomColumnsProvider) ??
                  ref.watch(appConfigProvider.select((config) => config.timeline.tilesPerRow)),
              showStorageIndicator: showStorageIndicator,
              withStack: withStack,
              groupBy: groupBy,
            ),
          ),
          if (readOnly) readonlyModeProvider.overrideWith(() => _AlwaysReadOnlyNotifier()),
        ],
        child: _SliverTimeline(
          topSliverWidget: topSliverWidget,
          topSliverWidgetHeight: topSliverWidgetHeight,
          bottomSliverWidget: bottomSliverWidget,
          appBar: appBar,
          bottomSheet: bottomSheet,
          withScrubber: withScrubber,
          persistentBottomBar: persistentBottomBar,
          snapToMonth: snapToMonth,
          maxWidth: constraints.maxWidth,
          loadingWidget: loadingWidget,
        ),
      ),
    );
  }
}

class _AlwaysReadOnlyNotifier extends ReadOnlyModeNotifier {
  @override
  bool build() => true;

  @override
  void setReadonlyMode(bool value) {}

  @override
  void toggleReadonlyMode() {}
}

class _SliverTimeline extends ConsumerStatefulWidget {
  const _SliverTimeline({
    this.topSliverWidget,
    this.topSliverWidgetHeight,
    this.bottomSliverWidget,
    this.appBar,
    this.bottomSheet,
    this.withScrubber = true,
    this.persistentBottomBar = false,
    this.snapToMonth = true,
    this.maxWidth,
    this.loadingWidget,
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final Widget? bottomSliverWidget;
  final Widget? appBar;
  final Widget? bottomSheet;
  final bool withScrubber;
  final bool persistentBottomBar;
  final bool snapToMonth;
  final double? maxWidth;
  final Widget? loadingWidget;

  @override
  ConsumerState createState() => _SliverTimelineState();
}

class _SliverTimelineState extends ConsumerState<_SliverTimeline> {
  late final ScrollController _scrollController;
  StreamSubscription? _eventSubscription;

  // Drag selection state
  bool _dragging = false;
  TimelineAssetIndex? _dragAnchorIndex;
  final Set<BaseAsset> _draggedAssets = HashSet();
  ScrollPhysics? _scrollPhysics;

  int? _restoreAssetIndex;
  // When restoring after a width change, keep the anchored asset at this vertical
  // offset within the viewport instead of the very top.
  double? _restoreFocalOffset;
  // Pinch-commit restore: a one-shot subscription that runs scroll-restore as
  // soon as the segment provider settles at the target column count, plus a
  // safety watchdog that runs the restore anyway if the provider stalls.
  ProviderSubscription? _zoomRestoreSubscription;
  Timer? _zoomRestoreWatchdog;

  // Date of the topmost visible asset, shown as a floating overlay in the
  // continuous "No grouping" layout (which has no per-section headers).
  final ValueNotifier<DateTime?> _floatingDate = ValueNotifier(null);

  // Debounce for thumbnail-cache warming around the viewport.
  Timer? _precacheTimer;

  // Pinch-zoom state. The gesture is tracked on a continuous z-axis where
  // z = log2(32 / cols) so a 2× pinch is one stop wide regardless of the current
  // level. On release we snap to the nearest discrete stop in [kTimelineZoomStops]
  // and restore scroll so the anchor asset stays under the focal point.
  static const double _zMin = 0.0; // 32 cols
  static const double _zMax = 5.0; // 1 col
  double _zBase = 0.0;
  double _zLive = 0.0;
  bool _zoomActive = false;
  Offset _focalViewport = Offset.zero;
  int? _pinchAnchorAssetIndex;

  double _zForColumns(double columns) => math.log(32.0 / columns) / math.ln2;

  // Snaps a z value to the column count of the nearest discrete zoom stop.
  int _colsForStopZ(double z) {
    final cols = 32.0 / math.pow(2.0, z);
    return kTimelineZoomStops.reduce((a, b) => (a - cols).abs() <= (b - cols).abs() ? a : b);
  }

  // Returns the asset under viewport point [focal] at [cols] columns, or null if
  // the segments aren't ready / there are no assets. Used to anchor the pinch on
  // the photo the user's fingers landed on.
  int? _assetUnderFocal(List<Segment> segments, Offset focal, int cols) {
    final rowFirstAsset = _getCurrentAssetIndex(segments, viewportOffset: focal.dy);
    if (rowFirstAsset == null) {
      return null;
    }
    final args = ref.read(timelineArgsProvider);
    final spacing = cols >= kTimelineMonthLabelMaxColumns ? 0.0 : kTimelineSpacing;
    final tile = (args.maxWidth - spacing * (cols - 1)) / cols;
    final pitch = tile + spacing;
    if (pitch <= 0) {
      return null;
    }
    final total = ref.read(timelineServiceProvider).totalAssets;
    final focalCol = (focal.dx / pitch).floor().clamp(0, cols - 1);
    return math.max(0, math.min(total - 1, rowFirstAsset + focalCol));
  }

  void _beginZoomSession({
    required List<Segment> segments,
    required Offset focal,
    required int baseCols,
    int? anchorAssetIndex,
    Offset? focalViewport,
  }) {
    _zBase = _zForColumns(baseCols.toDouble());
    _zLive = _zBase;
    _pinchAnchorAssetIndex = anchorAssetIndex ?? _assetUnderFocal(segments, focal, baseCols);
    _focalViewport = focalViewport ?? focal;
  }

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController(onAttach: _restoreAssetPosition);
    _scrollController.addListener(_updateFloatingDate);
    _eventSubscription = EventStream.shared.listen(_onEvent);

    ref.listenManual(multiSelectProvider.select((s) => s.isEnabled), _onMultiSelectionToggled);
  }

  @override
  void didUpdateWidget(covariant _SliverTimeline oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.maxWidth != oldWidget.maxWidth) {
      final asyncSegments = ref.read(timelineSegmentProvider);
      asyncSegments.whenData((segments) {
        final index = _getCurrentAssetIndex(segments);
        // Refresh to wait for new segments to be generated with the updated width before restoring the scroll position
        final _ = ref.refresh(timelineArgsProvider);
        _restoreAssetIndex = index;
      });
    }
  }

  void _onEvent(Event event) {
    switch (event) {
      case ScrollToTopEvent():
        ref.read(timelineStateProvider.notifier).setScrubbing(true);
        _scrollController
            .animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeInOut)
            .whenComplete(() => ref.read(timelineStateProvider.notifier).setScrubbing(false));

      case ScrollToDateEvent scrollToDateEvent:
        _scrollToDate(scrollToDateEvent.date);
      case TimelineZoomToAssetEvent zoomEvent:
        _zoomInOnAsset(zoomEvent.assetIndex);
      case TimelineReloadEvent():
        setState(() {});
      default:
        break;
    }
  }

  // Restores scroll so the anchor asset's row in the new layout sits at
  // [_restoreFocalOffset] (the pinch centroid Y captured at commit).
  void _restoreAssetPosition(_) {
    if (_restoreAssetIndex == null) {
      return;
    }
    final asyncSegments = ref.read(timelineSegmentProvider);
    // Skip if segments are still reloading for the new column count — ref.listen
    // on the provider will call us back once new segments emit.
    if (asyncSegments.isLoading || !asyncSegments.hasValue) {
      return;
    }
    final segments = asyncSegments.value!;
    if (segments.isEmpty) {
      _restoreAssetIndex = null;
      _restoreFocalOffset = null;
      return;
    }
    final assetIndex = _restoreAssetIndex!;
    final focalOffset = _restoreFocalOffset ?? 0.0;
    final targetSegment = segments.lastWhereOrNull((segment) => segment.firstAssetIndex <= assetIndex);
    if (targetSegment == null) {
      return;
    }
    final args = ref.read(timelineArgsProvider);
    final columnCount = args.columnCount;
    final spacing = columnCount >= kTimelineMonthLabelMaxColumns ? 0.0 : kTimelineSpacing;
    final tileHeight = (args.maxWidth - spacing * (columnCount - 1)) / columnCount;
    final rowIndexInSegment = targetSegment.rowIndexForAsset(assetIndex);
    final targetRowIndex = targetSegment.firstIndex + 1 + rowIndexInSegment;
    final rowTop = targetSegment.indexToLayoutOffset(targetRowIndex);
    // Place the row's vertical center at the focal Y so the photo under the
    // fingers stays put. rowTop is segment-local; the scroll offset target
    // adds the leading slivers' extent so the row lands at the focal Y on the
    // actual viewport.
    final desired = _leadingSliverExtent() + rowTop + tileHeight / 2 - focalOffset;
    _restoreAssetIndex = null;
    _restoreFocalOffset = null;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_scrollController.hasClients) {
        return;
      }
      final max = _scrollController.position.maxScrollExtent;
      _scrollController.jumpTo(desired.clamp(0.0, max));
    });
  }

  void _onMultiSelectionToggled(_, bool isEnabled) {
    EventStream.shared.emit(MultiSelectToggleEvent(isEnabled));
  }

  // Scroll extent consumed by the slivers BEFORE the segmented list (app bar + any
  // topSliverWidget). The segments' offsets are 0-based from the start of the
  // segmented list, but `_scrollController.offset` is in the overall scrollable's
  // coordinate, which includes these leading slivers. We need to subtract this when
  // converting a viewport-Y to a segment-local Y, and add it when converting a
  // segment-local Y to a `scrollController.offset` target.
  double _leadingSliverExtent() {
    if (widget.appBar == null) {
      return widget.topSliverWidgetHeight ?? 0.0;
    }
    // ImmichSliverAppBar (floating, pinned: false) visually extends into the status
    // bar area, so its scroll extent is status-bar + toolbar height.
    return MediaQuery.paddingOf(context).top + kToolbarHeight + (widget.topSliverWidgetHeight ?? 0.0);
  }

  int? _getCurrentAssetIndex(List<Segment> segments, {double viewportOffset = 0}) {
    final leading = _leadingSliverExtent();
    final maxExtent = _scrollController.position.maxScrollExtent;
    final lastEnd = segments.lastOrNull?.endOffset ?? maxExtent;
    final currentOffset = (_scrollController.offset + viewportOffset - leading).clamp(0.0, lastEnd);
    final segment = segments.findByOffset(currentOffset) ?? segments.lastOrNull;
    if (segment == null) {
      return null;
    }
    final rowIndex = segment.getMinChildIndexForScrollOffset(currentOffset);
    if (rowIndex <= segment.firstIndex) {
      return segment.firstAssetIndex;
    }
    final assetsPerRow = ref.read(timelineArgsProvider).columnCount;
    return segment.firstAssetIndex + (rowIndex - segment.firstIndex - 1) * assetsPerRow;
  }

  // Screen-space rect (unscaled) of a given asset's tile in the live grid — used to
  // capture the focal coordinate's row position at gesture start.
  Rect? _anchorTileRect(List<Segment> segments, int assetIndex, int columnCount, double maxWidth) {
    if (!_scrollController.hasClients) {
      return null;
    }
    final seg = segments.lastWhereOrNull((s) => s.firstAssetIndex <= assetIndex);
    if (seg == null) {
      return null;
    }
    final indexInSeg = assetIndex - seg.firstAssetIndex;
    final col = indexInSeg % columnCount;
    final rowInSeg = indexInSeg ~/ columnCount;
    final spacing = columnCount >= kTimelineMonthLabelMaxColumns ? 0.0 : kTimelineSpacing;
    final tile = (maxWidth - spacing * (columnCount - 1)) / columnCount;
    // Segment offsets are 0-based from the start of the segmented list; the actual
    // viewport Y is offset by the leading slivers' scroll extent.
    final top =
        _leadingSliverExtent() + seg.indexToLayoutOffset(seg.firstIndex + 1 + rowInSeg) - _scrollController.offset;
    return Rect.fromLTWH(col * (tile + spacing), top, tile, tile);
  }

  // Settles the gesture: stores the restore anchor for the post-rebuild scroll
  // jump, drops the live zoom transform, sets the new column count, and arms a
  // one-shot listener that runs the scroll-restore as soon as the segment
  // provider has emitted segments built for the new column count.
  void _commitZoom(int finalCols) {
    _restoreAssetIndex = _pinchAnchorAssetIndex;
    _restoreFocalOffset = _focalViewport.dy;
    ref.read(timelineStateProvider.notifier).setPinching(false);
    setState(() => _zoomActive = false);
    // Session-only — the user's persisted slider preference is untouched so the
    // next app launch isn't stuck at the last pinch level.
    ref.read(pinchZoomColumnsProvider.notifier).state = finalCols;
    _armZoomRestore(finalCols);
  }

  // One-shot subscription that runs the post-commit scroll restore exactly once,
  // when the segment provider emits its first settled value at [targetCols].
  // A 1.5s watchdog runs the restore anyway if the segment provider stalls, so
  // the user is never left with a dangling restore.
  void _armZoomRestore(int targetCols) {
    _zoomRestoreSubscription?.close();
    _zoomRestoreWatchdog?.cancel();

    void run() {
      _zoomRestoreSubscription?.close();
      _zoomRestoreSubscription = null;
      _zoomRestoreWatchdog?.cancel();
      _zoomRestoreWatchdog = null;
      if (mounted) {
        _restoreAssetPosition(null);
      }
    }

    _zoomRestoreSubscription = ref.listenManual(timelineSegmentProvider, (previous, next) {
      if (!next.hasValue || next.isLoading) {
        return;
      }
      if (ref.read(timelineArgsProvider).columnCount != targetCols) {
        return;
      }
      run();
    });
    _zoomRestoreWatchdog = Timer(const Duration(milliseconds: 1500), () {
      // The segment provider never emitted at the target column count — surface
      // it in debug so a real stall is visible instead of silently swallowed.
      assert(() {
        debugPrint('Timeline zoom-restore watchdog fired for cols=$targetCols');
        return true;
      }());
      run();
    });
  }

  // Tapping a tile in the dense layout starts a synthetic zoom session into the tapped
  // photo, stepping one stop denser — through the same engine as a pinch.
  void _zoomInOnAsset(int assetIndex) {
    final args = ref.read(timelineArgsProvider);
    final current = args.columnCount;
    final denser = kTimelineZoomStops.where((stop) => stop < current).toList();
    if (denser.isEmpty) {
      return;
    }
    final target = denser.reduce(math.max);
    final segments = ref.read(timelineSegmentProvider).valueOrNull;
    if (segments == null) {
      return;
    }
    final rect = _anchorTileRect(segments, assetIndex, current, args.maxWidth);
    final focalViewport = rect?.center ?? Offset(args.maxWidth / 2, args.maxHeight / 2);
    _beginZoomSession(
      segments: segments,
      focal: focalViewport,
      baseCols: current,
      anchorAssetIndex: assetIndex,
      focalViewport: focalViewport,
    );
    _primeZoomAssetWindow();
    unawaited(_precacheViewportWindow());
    _commitZoom(target);
  }

  void _updateFloatingDate() {
    if (!_scrollController.hasClients) {
      return;
    }
    // Only relevant in the continuous (header-less) layout: "No grouping" mode or
    // the wide zoom-out levels.
    final groupBy = ref.read(appConfigProvider.select((c) => c.timeline.groupAssetsBy));
    final columnCount = ref.read(timelineArgsProvider).columnCount;
    if (!isContinuousTimelineLayout(columnCount, groupBy)) {
      _floatingDate.value = null;
      return;
    }
    final segments = ref.read(timelineSegmentProvider).valueOrNull;
    if (segments == null || segments.isEmpty) {
      return;
    }
    final index = _getCurrentAssetIndex(segments);
    if (index == null) {
      return;
    }
    _floatingDate.value = ref.read(timelineServiceProvider).getAssetSafe(index)?.createdAt;
  }

  void _schedulePrecache() {
    _precacheTimer?.cancel();
    // 30ms is enough to coalesce a scroll burst but short enough that the first
    // segment-settle after app launch kicks off the wide-zoom precache right away,
    // so the cache is mostly warm by the time the user pinches out.
    _precacheTimer = Timer(const Duration(milliseconds: 30), () => unawaited(_precacheViewportWindow()));
  }

  void _primeZoomAssetWindow() {
    final service = ref.read(timelineServiceProvider);
    final total = service.totalAssets;
    if (total == 0) {
      return;
    }
    const window = 512;
    final focal = (_pinchAnchorAssetIndex ?? 0).clamp(0, total - 1);
    final start = math.max(0, focal - window ~/ 2);
    final count = math.min(window, total - start);
    unawaited(service.loadAssets(start, count).catchError((_) => const <BaseAsset>[]));
  }

  // Proactively warms the thumbnail cache around the viewport so committing a zoom
  // (in either direction) finds the new tiles already decoded instead of streaming
  // them in on the swap. The asset window is fetched read-only via peekAssets — it
  // never mutates the grid's shared buffer, so it can't race with scrolling — and
  // each asset is decoded at the current level's bucket plus the adjacent stops'.
  Future<void> _precacheViewportWindow() async {
    if (!mounted || !_scrollController.hasClients) {
      return;
    }
    final segments = ref.read(timelineSegmentProvider).valueOrNull;
    if (segments == null || segments.isEmpty) {
      return;
    }
    final service = ref.read(timelineServiceProvider);
    if (service.totalAssets == 0) {
      return;
    }
    final topIndex = _getCurrentAssetIndex(segments) ?? 0;
    final args = ref.read(timelineArgsProvider);
    final dpr = MediaQuery.devicePixelRatioOf(context);
    int bucketFor(int cols) {
      final spacing = cols >= kTimelineMonthLabelMaxColumns ? 0.0 : kTimelineSpacing;
      final tile = (args.maxWidth - spacing * (cols - 1)) / cols;
      return thumbnailDecodeEdge(tile, dpr);
    }

    // Warm all wider stops' thumbnails plus the next-finer stop for a zoom-in.
    // The tiny-thumbnail cache tier (8000 entries, ~96 MiB) easily holds the
    // dense levels so they can't evict the normal thumbnails the visible grid is
    // using. Each "tile-budget" is set to roughly the visible window at that
    // stop so the first time a user lands on a wide level there's nothing left
    // to decode on screen.
    final cols = args.columnCount;
    final widerStops = kTimelineZoomStops.where((s) => s > cols).toList();
    final closer = kTimelineZoomStops.where((s) => s < cols).fold<int?>(null, (a, b) => a == null ? b : math.max(a, b));
    final targets = <int>{...widerStops, if (closer != null) closer};
    if (targets.isEmpty) {
      return;
    }
    final widest = targets.reduce(math.max);
    // Wider stops have many more tiles per viewport, so use a larger asset
    // window. Tuned to fit a typical visible viewport at each stop without
    // saturating the image-decode pool against foreground tiles.
    final window = widest >= 32
        ? 1000
        : widest >= 16
        ? 480
        : 240;
    final assets = await service.peekAssets(math.max(0, topIndex - window ~/ 4), window);
    if (!mounted) {
      return;
    }
    for (final target in targets) {
      final size = Size.square(bucketFor(target).toDouble());
      for (final asset in assets) {
        final provider = getThumbnailImageProvider(asset, size: size);
        if (provider != null) {
          unawaited(precacheImage(provider, context));
        }
      }
    }
  }

  @override
  void dispose() {
    _precacheTimer?.cancel();
    _zoomRestoreSubscription?.close();
    _zoomRestoreWatchdog?.cancel();
    _scrollController.removeListener(_updateFloatingDate);
    _scrollController.dispose();
    _floatingDate.dispose();
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _scrollToDate(DateTime date) {
    final asyncSegments = ref.read(timelineSegmentProvider);
    asyncSegments.whenData((segments) {
      // Find the segment that contains assets from the target date
      final targetSegment = segments.firstWhereOrNull((segment) {
        if (segment.bucket is TimeBucket) {
          final segmentDate = (segment.bucket as TimeBucket).date;
          // Check if the segment date matches the target date (year, month, day)
          return segmentDate.year == date.year && segmentDate.month == date.month && segmentDate.day == date.day;
        }
        return false;
      });

      // If exact date not found, try to find the closest month
      final fallbackSegment =
          targetSegment ??
          segments.firstWhereOrNull((segment) {
            if (segment.bucket is TimeBucket) {
              final segmentDate = (segment.bucket as TimeBucket).date;
              return segmentDate.year == date.year && segmentDate.month == date.month;
            }
            return false;
          });

      if (fallbackSegment != null) {
        // Scroll to the segment with a small offset to show the header
        final targetOffset = fallbackSegment.startOffset - 50;
        ref.read(timelineStateProvider.notifier).setScrubbing(true);
        _scrollController
            .animateTo(
              targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            )
            .whenComplete(() => ref.read(timelineStateProvider.notifier).setScrubbing(false));
      } else {
        ref.read(timelineStateProvider.notifier).setScrubbing(false);
      }
    });
  }

  // Drag selection methods
  void _setDragStartIndex(TimelineAssetIndex index) {
    setState(() {
      _scrollPhysics = const ClampingScrollPhysics();
      _dragAnchorIndex = index;
      _dragging = true;
    });
  }

  void _stopDrag() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Update the physics post frame to prevent sudden change in physics on iOS.
      setState(() {
        _scrollPhysics = null;
      });
    });
    setState(() {
      _dragging = false;
      _draggedAssets.clear();
    });
    // Reset the scrolling state after a small delay to allow bottom sheet to expand again
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        ref.read(timelineStateProvider.notifier).setScrolling(false);
      }
    });
  }

  void _dragScroll(ScrollDirection direction) {
    _scrollController.animateTo(
      _scrollController.offset + (direction == ScrollDirection.forward ? 175 : -175),
      duration: const Duration(milliseconds: 125),
      curve: Curves.easeOut,
    );
  }

  void _handleDragAssetEnter(TimelineAssetIndex index) {
    if (_dragAnchorIndex == null || !_dragging) {
      return;
    }

    final timelineService = ref.read(timelineServiceProvider);
    final dragAnchorIndex = _dragAnchorIndex!;

    // Calculate the range of assets to select
    final startIndex = math.min(dragAnchorIndex.assetIndex, index.assetIndex);
    final endIndex = math.max(dragAnchorIndex.assetIndex, index.assetIndex);
    final count = endIndex - startIndex + 1;

    // Load the assets in the range
    if (timelineService.hasRange(startIndex, count)) {
      final selectedAssets = timelineService.getAssets(startIndex, count);

      // Clear previous drag selection and add new range
      final multiSelectNotifier = ref.read(multiSelectProvider.notifier);
      for (final asset in _draggedAssets) {
        multiSelectNotifier.deselectAsset(asset);
      }
      _draggedAssets.clear();

      for (final asset in selectedAssets) {
        multiSelectNotifier.selectAsset(asset);
        _draggedAssets.add(asset);
      }
    }
  }

  @override
  Widget build(BuildContext _) {
    // Width-change restores: when the timeline rebuilds for a maxWidth change
    // (e.g. orientation), didUpdateWidget seeds _restoreAssetIndex without arming
    // the zoom-commit one-shot. This listener finishes the restore once the new
    // segments arrive. (Zoom commits go through _armZoomRestore and do NOT rely
    // on this listener.) The precache warm always runs on settled emissions.
    ref.listen(timelineSegmentProvider, (previous, next) {
      if (!next.hasValue || next.isLoading) {
        return;
      }
      if (_restoreAssetIndex != null && _zoomRestoreSubscription == null) {
        _restoreAssetPosition(null);
      }
      _schedulePrecache();
    });

    final asyncSegments = ref.watch(timelineSegmentProvider);
    final maxHeight = ref.watch(timelineArgsProvider.select((args) => args.maxHeight));
    final isSelectionMode = ref.watch(multiSelectProvider.select((s) => s.forceEnable));
    final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
    final groupBy = ref.watch(appConfigProvider.select((c) => c.timeline.groupAssetsBy));
    final columnCount = ref.watch(timelineArgsProvider.select((args) => args.columnCount));
    final isContinuous = isContinuousTimelineLayout(columnCount, groupBy);
    // At the widest zoom levels (>=16) we replace the single top floating date with
    // a vertical strip of multiple month/year labels along the left edge — iOS's
    // year/month-view style. At narrower continuous levels (no-grouping mode at
    // <=6 cols) we keep the single floating label since there's effectively one
    // date visible per scroll-burst.
    final showLeftDateStrip = isContinuous && columnCount >= kTimelineMonthLabelMaxColumns;
    final showFloatingDate = isContinuous && !showLeftDateStrip;
    final isMultiSelectStatusVisible = !isSelectionMode && isMultiSelectEnabled;
    final isBottomWidgetVisible =
        widget.bottomSheet != null && (isMultiSelectStatusVisible || widget.persistentBottomBar);

    return PopScope(
      canPop: !isMultiSelectEnabled,
      onPopInvokedWithResult: (_, __) {
        if (isMultiSelectEnabled) {
          ref.read(multiSelectProvider.notifier).reset();
        }
      },
      child: PrimaryScrollController(
        controller: _scrollController,
        child: Scaffold(
          resizeToAvoidBottomInset: false,
          floatingActionButton: const DownloadStatusFloatingButton(),
          // skipLoadingOnRefresh defaults to true — during a zoom commit the
          // segment provider is refreshing, so the previous segments stay rendered
          // until the new ones arrive (no white-flash). The loading widget only
          // shows on the first-ever load when there's no previous value.
          body: asyncSegments.widgetWhen(
            onLoading: widget.loadingWidget != null ? () => widget.loadingWidget! : null,
            onData: (segments) => _buildLoadedTimeline(
              context,
              segments,
              maxHeight: maxHeight,
              isSelectionMode: isSelectionMode,
              isMultiSelectEnabled: isMultiSelectEnabled,
              isReadonlyModeEnabled: isReadonlyModeEnabled,
              columnCount: columnCount,
              showFloatingDate: showFloatingDate,
              showLeftDateStrip: showLeftDateStrip,
              isBottomWidgetVisible: isBottomWidgetVisible,
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildLoadedTimeline(
    BuildContext context,
    List<Segment> segments, {
    required double maxHeight,
    required bool isSelectionMode,
    required bool isMultiSelectEnabled,
    required bool isReadonlyModeEnabled,
    required int columnCount,
    required bool showFloatingDate,
    required bool showLeftDateStrip,
    required bool isBottomWidgetVisible,
  }) {
    final childCount = (segments.lastOrNull?.lastIndex ?? -1) + 1;
    final double appBarExpandedHeight = widget.appBar != null && widget.appBar is MesmerizingSliverAppBar ? 200 : 0;
    final topPadding = context.padding.top + (widget.appBar == null ? 0 : kToolbarHeight) + 10;

    const bottomSheetOpenModifier = 120.0;
    final contentBottomPadding = context.padding.bottom + (isMultiSelectEnabled ? bottomSheetOpenModifier : 0);
    final scrubberBottomPadding = contentBottomPadding + kScrubberThumbHeight;

    final grid = CustomScrollView(
      primary: true,
      physics: _scrollPhysics,
      scrollCacheExtent: .pixels(maxHeight * 2),
      slivers: [
        // Hide the app bar during a zoom: it lives in this scroll view (for its
        // floating behavior), so it would otherwise scale/slide with the grid. It
        // keeps its space (no layout jump) and fades back in once the zoom settles.
        if (isSelectionMode)
          const SelectionSliverAppBar()
        else if (widget.appBar != null)
          SliverOpacity(opacity: _zoomActive ? 0.0 : 1.0, sliver: widget.appBar!),
        if (widget.topSliverWidget != null) widget.topSliverWidget!,
        _SliverSegmentedList(
          segments: segments,
          delegate: SliverChildBuilderDelegate(
            (ctx, index) {
              if (index >= childCount) {
                return null;
              }
              final segment = segments.findByIndex(index);
              return segment?.builder(ctx, index) ?? const SizedBox.shrink();
            },
            childCount: childCount,
            addAutomaticKeepAlives: false,
            // We add repaint boundary around tiles, so skip the auto boundaries
            addRepaintBoundaries: false,
          ),
        ),
        if (widget.bottomSliverWidget != null) widget.bottomSliverWidget!,
        SliverPadding(padding: EdgeInsets.only(bottom: contentBottomPadding)),
      ],
    );

    // Keep the widget tree STABLE across the pinch — toggling tree shapes (Scrubber
    // wrapped vs Transform wrapped) re-elements the CustomScrollView, which destroys
    // the Scrollable's ScrollPosition and snaps you back to offset 0. So the tree is
    // always Scrubber(child: grid), and the live pinch scale is applied via a
    // Transform.scale that's ALWAYS in the tree (identity when not zooming).
    Widget timeline = widget.withScrubber
        ? Scrubber(
            snapToMonth: widget.snapToMonth,
            layoutSegments: segments,
            timelineHeight: maxHeight,
            topPadding: topPadding,
            bottomPadding: scrubberBottomPadding,
            monthSegmentSnappingOffset: widget.topSliverWidgetHeight ?? 0 + appBarExpandedHeight,
            hasAppBar: widget.appBar != null,
            child: grid,
          )
        : grid;
    final realScale = _zoomActive ? math.pow(2.0, _zLive - _zBase).toDouble() : 1.0;
    timeline = Transform.scale(scale: realScale, alignment: Alignment.topLeft, origin: _focalViewport, child: timeline);

    return RawGestureDetector(
      gestures: {
        CustomScaleGestureRecognizer: GestureRecognizerFactoryWithHandlers<CustomScaleGestureRecognizer>(
          () => CustomScaleGestureRecognizer(),
          (CustomScaleGestureRecognizer scale) {
            scale.onStart = (details) {
              // The recognizer emits a spurious onStart when a finger lifts (either just
              // before OR just after onEnd), which would wipe the accumulated zoom state
              // or abort an in-flight commit. Ignore any re-start while a session is
              // already active (pinch, settle, or commit); the next real pinch begins
              // once the session has fully revealed (_zoomActive == false).
              if (_zoomActive) {
                return;
              }
              // Capture the focal coordinate (the continuous asset position under the
              // fingers). Cancels any in-flight settle and starts a fresh session; the
              // session only becomes "active" once a real two-finger pinch is seen.
              _beginZoomSession(
                segments: segments,
                focal: details.localFocalPoint,
                baseCols: ref.read(timelineArgsProvider).columnCount,
              );
            };

            scale.onUpdate = (details) {
              // Track the live focal position (centroid for 2+ fingers, single finger
              // otherwise) and re-capture the anchor + green highlight from it. We do
              // this even on single-finger drags so the debug overlay always reflects
              // what the system thinks is under the finger — except mid-pinch with a
              // finger briefly lifted, where we keep the last 2-finger anchor stable.
              final isPinching = _zoomActive;
              final hasTwoFingers = details.pointerCount >= 2;
              if (!isPinching || hasTwoFingers) {
                _focalViewport = details.localFocalPoint;
                final cols = ref.read(timelineArgsProvider).columnCount;
                final anchor = _assetUnderFocal(segments, _focalViewport, cols);
                if (anchor != null) {
                  _pinchAnchorAssetIndex = anchor;
                }
              }
              // Only a true two-finger pinch zooms; single-finger pans scroll as usual.
              if (!hasTwoFingers) {
                return;
              }
              if (!_zoomActive) {
                _zoomActive = true;
                ref.read(timelineStateProvider.notifier).setPinching(true);
                _primeZoomAssetWindow();
                unawaited(_precacheViewportWindow());
              }
              final rawZDelta = math.log(details.scale) / math.ln2;
              final z = (_zBase + rawZDelta * _kPinchDampening).clamp(_zMin, _zMax).toDouble();
              setState(() => _zLive = z);
            };

            scale.onEnd = (details) {
              if (!_zoomActive) {
                _zLive = _zBase;
                return;
              }
              // Re-anchor on whatever was under the fingers right before release —
              // that's the scale pivot's fixed point and the row we restore around.
              final committed = ref.read(timelineArgsProvider).columnCount;
              final anchor = _assetUnderFocal(segments, _focalViewport, committed);
              if (anchor != null) {
                _pinchAnchorAssetIndex = anchor;
              }
              final target = _colsForStopZ(_zLive);
              if (target == committed) {
                // Stayed on the committed level — just drop the live scale.
                ref.read(timelineStateProvider.notifier).setPinching(false);
                if (mounted) {
                  setState(() {
                    _zoomActive = false;
                    _zLive = _zBase;
                  });
                }
              } else {
                _commitZoom(target);
              }
            };
          },
        ),
      },
      child: TimelineDragRegion(
        onStart: !isReadonlyModeEnabled ? _setDragStartIndex : null,
        onAssetEnter: _handleDragAssetEnter,
        onEnd: !isReadonlyModeEnabled ? _stopDrag : null,
        onScroll: _dragScroll,
        onScrollStart: () {
          // Minimize the bottom sheet when drag selection starts
          ref.read(timelineStateProvider.notifier).setScrolling(true);
        },
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            RepaintBoundary(child: timeline),
            if (showFloatingDate && !_zoomActive)
              Positioned(
                top: topPadding,
                left: 0,
                right: 0,
                child: IgnorePointer(
                  child: _FloatingDateLabel(date: _floatingDate, columnCount: columnCount),
                ),
              ),
            if (showLeftDateStrip && !_zoomActive)
              _LeftDateStrip(
                scrollController: _scrollController,
                segments: segments,
                topPadding: topPadding,
                columnCount: columnCount,
              ),
            if (isBottomWidgetVisible)
              Positioned(
                top: MediaQuery.paddingOf(context).top,
                left: 25,
                child: const SizedBox(
                  height: kToolbarHeight,
                  child: Center(child: _MultiSelectStatusButton()),
                ),
              ),
            if (isBottomWidgetVisible) widget.bottomSheet!,
          ],
        ),
      ),
    );
  }
}

class _SliverSegmentedList extends SliverMultiBoxAdaptorWidget {
  final List<Segment> _segments;

  const _SliverSegmentedList({required List<Segment> segments, required super.delegate}) : _segments = segments;

  @override
  _RenderSliverTimelineBoxAdaptor createRenderObject(BuildContext context) =>
      _RenderSliverTimelineBoxAdaptor(childManager: context as SliverMultiBoxAdaptorElement, segments: _segments);

  @override
  void updateRenderObject(BuildContext context, _RenderSliverTimelineBoxAdaptor renderObject) {
    renderObject.segments = _segments;
  }
}

/// Modified version of [RenderSliverFixedExtentBoxAdaptor] to use precomputed offsets
class _RenderSliverTimelineBoxAdaptor extends RenderSliverMultiBoxAdaptor {
  List<Segment> _segments;

  set segments(List<Segment> updatedSegments) {
    if (_segments.equals(updatedSegments)) {
      return;
    }
    _segments = updatedSegments;
    markNeedsLayout();
  }

  _RenderSliverTimelineBoxAdaptor({required super.childManager, required List<Segment> segments})
    : _segments = segments;

  int getMinChildIndexForScrollOffset(double offset) =>
      _segments.findByOffset(offset)?.getMinChildIndexForScrollOffset(offset) ?? 0;

  int getMaxChildIndexForScrollOffset(double offset) =>
      _segments.findByOffset(offset)?.getMaxChildIndexForScrollOffset(offset) ?? 0;

  double indexToLayoutOffset(int index) =>
      (_segments.findByIndex(index) ?? _segments.lastOrNull)?.indexToLayoutOffset(index) ?? 0;

  double estimateMaxScrollOffset() => _segments.lastOrNull?.endOffset ?? 0;

  double computeMaxScrollOffset() => _segments.lastOrNull?.endOffset ?? 0;

  @override
  void performLayout() {
    childManager.didStartLayout();
    // Assume initially that we have enough children to fill the viewport/cache area.
    childManager.setDidUnderflow(false);

    final double scrollOffset = constraints.scrollOffset + constraints.cacheOrigin;
    assert(scrollOffset >= 0.0);

    final double remainingExtent = constraints.remainingCacheExtent;
    assert(remainingExtent >= 0.0);

    final double targetScrollOffset = scrollOffset + remainingExtent;

    // Find the index of the first child that should be visible or in the leading cache area.
    final int firstRequiredChildIndex = getMinChildIndexForScrollOffset(scrollOffset);

    // Find the index of the last child that should be visible or in the trailing cache area.
    final int? lastRequiredChildIndex = targetScrollOffset.isFinite
        ? getMaxChildIndexForScrollOffset(targetScrollOffset)
        : null;

    // Remove children that are no longer visible or within the cache area.
    if (firstChild == null) {
      collectGarbage(0, 0);
    } else {
      final int leadingChildrenToRemove = calculateLeadingGarbage(firstIndex: firstRequiredChildIndex);
      final int trailingChildrenToRemove = lastRequiredChildIndex == null
          ? 0
          : calculateTrailingGarbage(lastIndex: lastRequiredChildIndex);
      collectGarbage(leadingChildrenToRemove, trailingChildrenToRemove);
    }

    // If there are currently no children laid out (e.g., initial load),
    // try to add the first child needed for the current scroll offset.
    if (firstChild == null) {
      final double firstChildLayoutOffset = indexToLayoutOffset(firstRequiredChildIndex);
      final bool childAdded = addInitialChild(index: firstRequiredChildIndex, layoutOffset: firstChildLayoutOffset);

      if (!childAdded) {
        // There are either no children, or we are past the end of all our children.
        final double max = firstRequiredChildIndex <= 0 ? 0.0 : computeMaxScrollOffset();
        geometry = SliverGeometry(scrollExtent: max, maxPaintExtent: max);
        childManager.didFinishLayout();
        return;
      }
    }

    // Layout children that might have scrolled into view from the top (before the current firstChild).
    RenderBox? highestLaidOutChild;
    final childConstraints = constraints.asBoxConstraints();

    for (int currentIndex = indexOf(firstChild!) - 1; currentIndex >= firstRequiredChildIndex; --currentIndex) {
      final RenderBox? newLeadingChild = insertAndLayoutLeadingChild(childConstraints);
      if (newLeadingChild == null) {
        // If a child is missing where we expect one, it indicates
        // an inconsistency in offset that needs correction.
        final Segment? segment = _segments.findByIndex(currentIndex) ?? _segments.firstOrNull;
        geometry = SliverGeometry(
          // Request a scroll correction based on where the missing child should have been.
          scrollOffsetCorrection: segment?.indexToLayoutOffset(currentIndex) ?? 0.0,
        );
        // Parent will re-layout everything.
        return;
      }
      final childParentData = newLeadingChild.parentData! as SliverMultiBoxAdaptorParentData;
      childParentData.layoutOffset = indexToLayoutOffset(currentIndex);
      assert(childParentData.index == currentIndex);
      highestLaidOutChild ??= newLeadingChild;
    }

    // If the loop above didn't run (meaning the firstChild was already the correct [firstRequiredChildIndex]),
    // or even if it did, we need to ensure the first visible child is correctly laid out
    // and establish our starting point for laying out trailing children.

    // If [highestLaidOutChild] is still null, it means the loop above didn't add any new leading children.
    // The [firstChild] that existed at the start of performLayout is still the first one we need.
    if (highestLaidOutChild == null) {
      firstChild!.layout(childConstraints);
      final childParentData = firstChild!.parentData! as SliverMultiBoxAdaptorParentData;
      childParentData.layoutOffset = indexToLayoutOffset(firstRequiredChildIndex);
      highestLaidOutChild = firstChild;
    }

    RenderBox? mostRecentlyLaidOutChild = highestLaidOutChild;

    // Starting from the child after [mostRecentlyLaidOutChild], layout subsequent children
    // until we reach the [lastRequiredChildIndex] or run out of children.
    double calculatedMaxScrollOffset = double.infinity;

    for (
      int currentIndex = indexOf(mostRecentlyLaidOutChild!) + 1;
      lastRequiredChildIndex == null || currentIndex <= lastRequiredChildIndex;
      ++currentIndex
    ) {
      RenderBox? child = childAfter(mostRecentlyLaidOutChild!);

      if (child == null || indexOf(child) != currentIndex) {
        child = insertAndLayoutChild(childConstraints, after: mostRecentlyLaidOutChild);
        if (child == null) {
          final Segment? segment = _segments.findByIndex(currentIndex) ?? _segments.lastOrNull;
          calculatedMaxScrollOffset = segment?.indexToLayoutOffset(currentIndex) ?? computeMaxScrollOffset();
          break;
        }
      } else {
        child.layout(childConstraints);
      }

      mostRecentlyLaidOutChild = child;
      final childParentData = mostRecentlyLaidOutChild.parentData! as SliverMultiBoxAdaptorParentData;
      assert(childParentData.index == currentIndex);
      childParentData.layoutOffset = indexToLayoutOffset(currentIndex);
    }

    final int lastLaidOutChildIndex = indexOf(lastChild!);
    final double leadingScrollOffset = indexToLayoutOffset(firstRequiredChildIndex);
    final double trailingScrollOffset = indexToLayoutOffset(lastLaidOutChildIndex + 1);

    assert(
      firstRequiredChildIndex == 0 ||
          (childScrollOffset(firstChild!) ?? -1.0) - scrollOffset <= precisionErrorTolerance,
    );
    assert(debugAssertChildListIsNonEmptyAndContiguous());
    assert(indexOf(firstChild!) == firstRequiredChildIndex);
    assert(lastRequiredChildIndex == null || lastLaidOutChildIndex <= lastRequiredChildIndex);

    calculatedMaxScrollOffset = math.min(calculatedMaxScrollOffset, estimateMaxScrollOffset());

    final double paintExtent = calculatePaintOffset(constraints, from: leadingScrollOffset, to: trailingScrollOffset);

    final double cacheExtent = calculateCacheOffset(constraints, from: leadingScrollOffset, to: trailingScrollOffset);

    final double targetEndScrollOffsetForPaint = constraints.scrollOffset + constraints.remainingPaintExtent;
    final int? targetLastIndexForPaint = targetEndScrollOffsetForPaint.isFinite
        ? getMaxChildIndexForScrollOffset(targetEndScrollOffsetForPaint)
        : null;

    final maxPaintExtent = math.max(paintExtent, calculatedMaxScrollOffset);

    geometry = SliverGeometry(
      scrollExtent: calculatedMaxScrollOffset,
      paintExtent: paintExtent,
      maxPaintExtent: maxPaintExtent,
      // Indicates if there's content scrolled off-screen.
      // This is true if the last child needed for painting is actually laid out,
      // or if the first child is partially visible.
      hasVisualOverflow:
          (targetLastIndexForPaint != null && lastLaidOutChildIndex >= targetLastIndexForPaint) ||
          constraints.scrollOffset > 0.0,
      cacheExtent: cacheExtent,
    );

    // We may have started the layout while scrolled to the end, which would not
    // expose a new child.
    if (calculatedMaxScrollOffset == trailingScrollOffset) {
      childManager.setDidUnderflow(true);
    }

    childManager.didFinishLayout();
  }
}

class _MultiSelectStatusButton extends ConsumerWidget {
  const _MultiSelectStatusButton();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectCount = ref.watch(multiSelectProvider.select((s) => s.selectedAssets.length));
    return ElevatedButton.icon(
      onPressed: () => ref.read(multiSelectProvider.notifier).reset(),
      icon: Icon(Icons.close_rounded, color: context.colorScheme.onPrimary),
      label: Text(
        selectCount.toString(),
        style: context.textTheme.titleMedium?.copyWith(height: 2.5, color: context.colorScheme.onPrimary),
      ),
    );
  }
}

/// Sticky overlay showing the date of the topmost visible asset while the
/// timeline is in the continuous "No grouping" layout (which has no headers).
/// The label granularity coarsens as the grid zooms out.
class _FloatingDateLabel extends StatelessWidget {
  const _FloatingDateLabel({required this.date, required this.columnCount});

  final ValueNotifier<DateTime?> date;
  final int columnCount;

  String _format(DateTime value) {
    if (columnCount <= kTimelineGroupedMaxColumnCount) {
      return DateFormat.yMMMd().format(value);
    }
    if (columnCount <= kTimelineMonthLabelMaxColumns) {
      return DateFormat.yMMMM().format(value);
    }
    return DateFormat.y().format(value);
  }

  @override
  Widget build(BuildContext context) {
    return ValueListenableBuilder<DateTime?>(
      valueListenable: date,
      builder: (context, value, _) {
        return AnimatedOpacity(
          opacity: value == null ? 0 : 1,
          duration: const Duration(milliseconds: 150),
          child: value == null
              ? const SizedBox.shrink()
              : Center(
                  child: Container(
                    margin: const EdgeInsets.only(top: 8),
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: context.colorScheme.surfaceContainerHighest.withValues(alpha: 0.9),
                      borderRadius: const BorderRadius.all(Radius.circular(20)),
                    ),
                    child: Text(
                      _format(value),
                      style: context.textTheme.labelLarge?.copyWith(color: context.colorScheme.onSurface),
                    ),
                  ),
                ),
        );
      },
    );
  }
}

/// Vertical strip of month/year labels along the left side of the timeline at the
/// wide zoom levels. The strip walks the segments (chunked, each carrying its first
/// asset's date) and emits a label whenever the month (or year, at the widest stop)
/// changes — so multiple dates are visible at once, like the iOS Photos year/month
/// views. Hidden while the scrubber is active to avoid showing date info twice.
class _LeftDateStrip extends ConsumerWidget {
  const _LeftDateStrip({
    required this.scrollController,
    required this.segments,
    required this.topPadding,
    required this.columnCount,
  });

  final ScrollController scrollController;
  final List<Segment> segments;
  final double topPadding;
  final int columnCount;

  bool _isNewBucket(DateTime? prev, DateTime current) {
    if (prev == null) {
      return true;
    }
    if (columnCount > kTimelineMonthLabelMaxColumns) {
      return prev.year != current.year;
    }
    return prev.year != current.year || prev.month != current.month;
  }

  String _format(DateTime date) {
    if (columnCount > kTimelineMonthLabelMaxColumns) {
      return DateFormat.y().format(date);
    }
    return DateFormat.yMMM().format(date);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isScrubbing = ref.watch(timelineStateProvider.select((s) => s.isScrubbing));
    if (isScrubbing) {
      return const SizedBox.shrink();
    }
    return AnimatedBuilder(
      animation: scrollController,
      builder: (context, _) {
        if (!scrollController.hasClients) {
          return const SizedBox.shrink();
        }
        final scrollOffset = scrollController.offset;
        final viewportHeight = scrollController.position.viewportDimension;
        final labels = <_DateLabelPosition>[];
        DateTime? previousDate;
        for (final segment in segments) {
          final bucket = segment.bucket;
          if (bucket is! TimeBucket) {
            previousDate = null;
            continue;
          }
          final date = bucket.date;
          if (_isNewBucket(previousDate, date)) {
            final y = topPadding + segment.startOffset - scrollOffset;
            if (y > -40 && y < viewportHeight + 40) {
              labels.add(_DateLabelPosition(date: date, y: y));
            }
          }
          previousDate = date;
        }
        if (labels.isEmpty) {
          return const SizedBox.shrink();
        }
        return Stack(
          clipBehavior: Clip.none,
          children: [
            for (final label in labels)
              Positioned(
                top: label.y,
                left: 6,
                child: IgnorePointer(
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: context.colorScheme.surfaceContainerHighest.withValues(alpha: 0.82),
                      borderRadius: const BorderRadius.all(Radius.circular(10)),
                    ),
                    child: Text(
                      _format(label.date),
                      style: context.textTheme.labelSmall?.copyWith(color: context.colorScheme.onSurface),
                    ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}

class _DateLabelPosition {
  const _DateLabelPosition({required this.date, required this.y});
  final DateTime date;
  final double y;
}

/// accepts a gesture even though it should reject it (because child won)
class CustomScaleGestureRecognizer extends ScaleGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}
