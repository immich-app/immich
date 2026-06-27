import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/events.model.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/action_buttons/download_status_floating_button.widget.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/presentation/widgets/timeline/drag_selection_controller.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline_drag_region.dart';
import 'package:immich_mobile/providers/infrastructure/readonly_mode.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';
import 'package:immich_mobile/providers/timeline/multiselect.provider.dart';
import 'package:immich_mobile/widgets/common/immich_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/mesmerizing_sliver_app_bar.dart';
import 'package:immich_mobile/widgets/common/selection_sliver_app_bar.dart';

// First asset index of the row shown at [offset]. Pure for testing.
@visibleForTesting
int? assetIndexAtOffset(
  List<Segment> segments,
  double offset, {
  required int columnCount,
  required double maxScrollExtent,
}) {
  final clamped = offset.clamp(0.0, maxScrollExtent);
  final segment = segments.findByOffset(clamped) ?? segments.lastOrNull;
  if (segment == null) {
    return null;
  }
  final rowIndex = segment.getMinChildIndexForScrollOffset(clamped);
  if (rowIndex > segment.firstIndex) {
    final rowIndexInSegment = rowIndex - (segment.firstIndex + 1);
    return segment.firstAssetIndex + rowIndexInSegment * columnCount;
  }
  return segment.firstAssetIndex;
}

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
              columnCount: ref.watch(appConfigProvider.select((config) => config.timeline.tilesPerRow)),
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
  static const _autoScrollStep = 175.0;
  static const _autoScrollDuration = Duration(milliseconds: 125);
  bool _dragging = false;
  DragSelectionController? _dragController;
  ScrollPhysics? _scrollPhysics;

  int _perRow = 4;
  double _scaleFactor = 3.0;
  double _baseScaleFactor = 3.0;
  int? _restoreAssetIndex;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController(onAttach: _restoreAssetPosition);
    _eventSubscription = EventStream.shared.listen(_onEvent);

    final currentTilesPerRow = ref.read(appConfigProvider.select((config) => config.timeline.tilesPerRow));
    _perRow = currentTilesPerRow;
    _scaleFactor = 7.0 - _perRow;
    _baseScaleFactor = _scaleFactor;

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
        {
          final timelineState = ref.read(timelineStateProvider.notifier);
          timelineState.setScrubbing(true);
          _scrollController
              .animateTo(0, duration: const Duration(milliseconds: 250), curve: Curves.easeInOut)
              .whenComplete(() => timelineState.setScrubbing(false));
        }

      case ScrollToDateEvent scrollToDateEvent:
        _scrollToDate(scrollToDateEvent.date);
      case TimelineReloadEvent():
        setState(() {});
      default:
        break;
    }
  }

  void _restoreAssetPosition(_) {
    if (_restoreAssetIndex == null) {
      return;
    }

    final asyncSegments = ref.read(timelineSegmentProvider);
    asyncSegments.whenData((segments) {
      final targetSegment = segments.lastWhereOrNull((segment) => segment.firstAssetIndex <= _restoreAssetIndex!);
      if (targetSegment != null) {
        final assetIndexInSegment = _restoreAssetIndex! - targetSegment.firstAssetIndex;
        final newColumnCount = ref.read(timelineArgsProvider).columnCount;
        final rowIndexInSegment = (assetIndexInSegment / newColumnCount).floor();
        final targetRowIndex = targetSegment.firstIndex + 1 + rowIndexInSegment;
        final targetOffset = targetSegment.indexToLayoutOffset(targetRowIndex);
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (mounted) {
            _scrollController.jumpTo(targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent));
          }
        });
      }
    });
    _restoreAssetIndex = null;
  }

  void _onMultiSelectionToggled(_, bool isEnabled) {
    EventStream.shared.emit(MultiSelectToggleEvent(isEnabled));
  }

  int? _getCurrentAssetIndex(List<Segment> segments) => _assetIndexAtOffset(segments, _scrollController.offset);

  int? _assetIndexAtOffset(List<Segment> segments, double offset) => assetIndexAtOffset(
    segments,
    offset,
    columnCount: ref.read(timelineArgsProvider).columnCount,
    maxScrollExtent: _scrollController.position.maxScrollExtent,
  );

  @override
  void dispose() {
    _dragController?.dispose();
    _scrollController.dispose();
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _scrollToDate(DateTime date) {
    final timelineState = ref.read(timelineStateProvider.notifier);
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
        timelineState.setScrubbing(true);
        _scrollController
            .animateTo(
              targetOffset.clamp(0.0, _scrollController.position.maxScrollExtent),
              duration: const Duration(milliseconds: 500),
              curve: Curves.easeInOut,
            )
            .whenComplete(() => timelineState.setScrubbing(false));
      } else {
        timelineState.setScrubbing(false);
      }
    });
  }

  // Drag selection methods
  void _setDragStartIndex(TimelineAssetIndex index) {
    // Stop the old drag's controller so its in-flight read can't leak into this one.
    _dragController?.dispose();
    final timelineService = ref.read(timelineServiceProvider);
    _dragController = DragSelectionController(
      getAssetSafe: timelineService.getAssetSafe,
      getAssetsRange: timelineService.getAssetsRange,
      onChange: (select, deselect) {
        if (!mounted) {
          return;
        }
        ref.read(multiSelectProvider.notifier).selectRange(select, deselect);
      },
    )..start(index.assetIndex);
    setState(() {
      _scrollPhysics = const ClampingScrollPhysics();
      _dragging = true;
    });
  }

  void _stopDrag() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Update the physics post frame to prevent sudden change in physics on iOS.
      if (mounted) {
        setState(() {
          _scrollPhysics = null;
        });
      }
    });
    setState(() {
      _dragging = false;
    });
    // Apply the full final range even if a read is still in flight on lift.
    final finishing = _dragController?.end();
    if (finishing != null) {
      unawaited(finishing);
    }
    final timelineState = ref.read(timelineStateProvider.notifier);
    Future.delayed(const Duration(milliseconds: 300), () {
      timelineState.setScrolling(false);
    });
  }

  void _dragScroll(ScrollDirection direction) {
    final position = _scrollController.position;
    final step = direction == ScrollDirection.forward ? _autoScrollStep : -_autoScrollStep;
    final target = (_scrollController.offset + step).clamp(0.0, position.maxScrollExtent);
    _scrollController.animateTo(target, duration: _autoScrollDuration, curve: Curves.easeOut);

    // A held finger emits no move events, so extend the selection to the asset
    // at the leading edge of the scroll instead.
    final controller = _dragController;
    if (controller == null) {
      return;
    }
    final segments = ref.read(timelineSegmentProvider).valueOrNull;
    if (segments == null) {
      return;
    }
    final edgeOffset = direction == ScrollDirection.forward ? target + position.viewportDimension : target;
    final edgeIndex = _assetIndexAtOffset(segments, edgeOffset);
    if (edgeIndex != null) {
      controller.enter(edgeIndex);
    }
  }

  void _handleDragAssetEnter(TimelineAssetIndex index) {
    if (!_dragging) {
      return;
    }
    _dragController?.enter(index.assetIndex);
  }

  @override
  Widget build(BuildContext _) {
    final asyncSegments = ref.watch(timelineSegmentProvider);
    final maxHeight = ref.watch(timelineArgsProvider.select((args) => args.maxHeight));
    final isSelectionMode = ref.watch(multiSelectProvider.select((s) => s.forceEnable));
    final isMultiSelectEnabled = ref.watch(multiSelectProvider.select((s) => s.isEnabled));
    final isReadonlyModeEnabled = ref.watch(readonlyModeProvider);
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
          body: asyncSegments.widgetWhen(
            onLoading: widget.loadingWidget != null ? () => widget.loadingWidget! : null,
            onData: (segments) {
              final childCount = (segments.lastOrNull?.lastIndex ?? -1) + 1;
              final double appBarExpandedHeight = widget.appBar != null && widget.appBar is MesmerizingSliverAppBar
                  ? 200
                  : 0;
              final topPadding = context.padding.top + (widget.appBar == null ? 0 : kToolbarHeight) + 10;

              const bottomSheetOpenModifier = 120.0;
              final contentBottomPadding =
                  context.padding.bottom + (isMultiSelectEnabled ? bottomSheetOpenModifier : 0);
              final scrubberBottomPadding = contentBottomPadding + kScrubberThumbHeight;

              final grid = CustomScrollView(
                primary: true,
                physics: _scrollPhysics,
                scrollCacheExtent: .pixels(maxHeight * 2),
                slivers: [
                  if (isSelectionMode) const SelectionSliverAppBar() else if (widget.appBar != null) widget.appBar!,
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

              final Widget timeline;
              if (widget.withScrubber) {
                timeline = Scrubber(
                  snapToMonth: widget.snapToMonth,
                  layoutSegments: segments,
                  timelineHeight: maxHeight,
                  topPadding: topPadding,
                  bottomPadding: scrubberBottomPadding,
                  monthSegmentSnappingOffset: widget.topSliverWidgetHeight ?? 0 + appBarExpandedHeight,
                  hasAppBar: widget.appBar != null,
                  child: grid,
                );
              } else {
                timeline = grid;
              }

              return RawGestureDetector(
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
                          final targetAssetIndex = _getCurrentAssetIndex(segments);
                          setState(() {
                            _scaleFactor = newScaleFactor;
                            _perRow = newPerRow;
                            _restoreAssetIndex = targetAssetIndex;
                          });

                          ref.read(settingsProvider).write(.timelineTilesPerRow, _perRow);
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
                      timeline,
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
            },
          ),
        ),
      ),
    );
  }
}

class _SliverSegmentedList extends SliverMultiBoxAdaptorWidget {
  final List<Segment> _segments;

  const _SliverSegmentedList({required this._segments, required super.delegate});

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

  _RenderSliverTimelineBoxAdaptor({required super.childManager, required this._segments});

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
