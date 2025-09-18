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
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/selection_sliver_app_bar.dart';

class Timeline extends StatelessWidget {
  const Timeline({
    super.key,
    this.topSliverWidget,
    this.topSliverWidgetHeight,
    this.showStorageIndicator = false,
    this.withStack = false,
    this.appBar = const ImmichSliverAppBar(floating: true, pinned: false, snap: false),
    this.bottomSheet = const GeneralBottomSheet(minChildSize: 0.18),
    this.groupBy,
    this.withScrubber = true,
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final bool showStorageIndicator;
  final Widget? appBar;
  final Widget? bottomSheet;
  final bool withStack;
  final GroupAssetsBy? groupBy;
  final bool withScrubber;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      resizeToAvoidBottomInset: false,
      body: LayoutBuilder(
        builder: (_, constraints) => ProviderScope(
          overrides: [
            timelineArgsProvider.overrideWith(
              (ref) => TimelineArgs(
                maxWidth: constraints.maxWidth,
                maxHeight: constraints.maxHeight,
                columnCount: ref.watch(settingsProvider.select((s) => s.get(Setting.tilesPerRow))),
                showStorageIndicator: showStorageIndicator,
                withStack: withStack,
                groupBy: groupBy,
              ),
            ),
          ],
          child: _SliverTimeline(
            topSliverWidget: topSliverWidget,
            topSliverWidgetHeight: topSliverWidgetHeight,
            appBar: appBar,
            bottomSheet: bottomSheet,
            withScrubber: withScrubber,
          ),
        ),
      ),
    );
  }
}

class _SliverTimeline extends ConsumerStatefulWidget {
  const _SliverTimeline({
    this.topSliverWidget,
    this.topSliverWidgetHeight,
    this.appBar,
    this.bottomSheet,
    this.withScrubber = true,
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final Widget? appBar;
  final Widget? bottomSheet;
  final bool withScrubber;

  @override
  ConsumerState createState() => _SliverTimelineState();
}

class _SliverTimelineState extends ConsumerState<_SliverTimeline> {
  final _scrollController = ScrollController();
  StreamSubscription? _eventSubscription;

  // Drag selection state
  bool _dragging = false;
  TimelineAssetIndex? _dragAnchorIndex;
  final Set<BaseAsset> _draggedAssets = HashSet();
  ScrollPhysics? _scrollPhysics;

  int _perRow = 4;
  double _scaleFactor = 3.0;
  double _baseScaleFactor = 3.0;

  @override
  void initState() {
    super.initState();
    _eventSubscription = EventStream.shared.listen(_onEvent);

    final currentTilesPerRow = ref.read(settingsProvider).get(Setting.tilesPerRow);
    _perRow = currentTilesPerRow;
    _scaleFactor = 7.0 - _perRow;
    _baseScaleFactor = _scaleFactor;

    ref.listenManual(multiSelectProvider.select((s) => s.isEnabled), _onMultiSelectionToggled);
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
      case TimelineReloadEvent():
        setState(() {});
      default:
        break;
    }
  }

  void _onMultiSelectionToggled(_, bool isEnabled) {
    EventStream.shared.emit(MultiSelectToggleEvent(isEnabled));
  }

  @override
  void dispose() {
    _scrollController.dispose();
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
        _scrollController.animateTo(
          targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
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
    if (_dragAnchorIndex == null || !_dragging) return;

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
    final asyncSegments = ref.watch(timelineSegmentProvider);
    final maxHeight = ref.watch(timelineArgsProvider.select((args) => args.maxHeight));
    final isSelectionMode = ref.watch(multiSelectProvider.select((s) => s.forceEnable));
    final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);

    return PopScope(
      canPop: !isMultiSelectEnabled,
      onPopInvokedWithResult: (_, __) {
        if (isMultiSelectEnabled) {
          ref.read(multiSelectProvider.notifier).reset();
        }
      },
      child: asyncSegments.widgetWhen(
        onData: (segments) {
          final childCount = (segments.lastOrNull?.lastIndex ?? -1) + 1;
          final double appBarExpandedHeight = widget.appBar != null && widget.appBar is MesmerizingSliverAppBar
              ? 200
              : 0;
          final topPadding = context.padding.top + (widget.appBar == null ? 0 : kToolbarHeight) + 10;

          const scrubberBottomPadding = 100.0;
          final bottomPadding = context.padding.bottom + (widget.appBar == null ? 0 : scrubberBottomPadding);

          final grid = CustomScrollView(
            primary: true,
            physics: _scrollPhysics,
            cacheExtent: maxHeight * 2,
            slivers: [
              if (isSelectionMode) const SelectionSliverAppBar() else if (widget.appBar != null) widget.appBar!,
              if (widget.topSliverWidget != null) widget.topSliverWidget!,
              _SliverSegmentedList(
                segments: segments,
                delegate: SliverChildBuilderDelegate(
                  (ctx, index) {
                    if (index >= childCount) return null;
                    final segment = segments.findByIndex(index);
                    return segment?.builder(ctx, index) ?? const SizedBox.shrink();
                  },
                  childCount: childCount,
                  addAutomaticKeepAlives: false,
                  // We add repaint boundary around tiles, so skip the auto boundaries
                  addRepaintBoundaries: false,
                ),
              ),
              const SliverPadding(padding: EdgeInsets.only(bottom: scrubberBottomPadding)),
            ],
          );

          final Widget timeline;
          if (widget.withScrubber) {
            timeline = Scrubber(
              layoutSegments: segments,
              timelineHeight: maxHeight,
              topPadding: topPadding,
              bottomPadding: bottomPadding,
              monthSegmentSnappingOffset: widget.topSliverWidgetHeight ?? 0 + appBarExpandedHeight,
              child: grid,
            );
          } else {
            timeline = grid;
          }

          return PrimaryScrollController(
            controller: _scrollController,
            child: RawGestureDetector(
              gestures: {
                CustomScaleGestureRecognizer: GestureRecognizerFactoryWithHandlers<CustomScaleGestureRecognizer>(
                  () => CustomScaleGestureRecognizer(),
                  (CustomScaleGestureRecognizer scale) {
                    scale.onStart = (details) {
                      _baseScaleFactor = _scaleFactor;
                    };

                    scale.onUpdate = (details) {
                      final newScaleFactor = math.max(math.min(5.0, _baseScaleFactor * details.scale), 1.0);
                      final newPerRow = 7 - newScaleFactor.toInt();

                      if (newPerRow != _perRow) {
                        setState(() {
                          _scaleFactor = newScaleFactor;
                          _perRow = newPerRow;
                        });

                        ref.read(settingsProvider.notifier).set(Setting.tilesPerRow, _perRow);
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
                  children: [
                    timeline,
                    if (!isSelectionMode && isMultiSelectEnabled) ...[
                      Positioned(
                        top: MediaQuery.paddingOf(context).top,
                        left: 25,
                        child: const SizedBox(
                          height: kToolbarHeight,
                          child: Center(child: _MultiSelectStatusButton()),
                        ),
                      ),
                      if (widget.bottomSheet != null) widget.bottomSheet!,
                    ],
                  ],
                ),
              ),
            ),
          );
        },
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

/// accepts a gesture even though it should reject it (because child won)
class CustomScaleGestureRecognizer extends ScaleGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}
