import 'dart:async';
import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/utils/event_stream.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/bottom_sheet/general_bottom_sheet.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
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
    this.appBar,
    this.bottomSheet = const GeneralBottomSheet(),
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final bool showStorageIndicator;
  final Widget? appBar;
  final Widget? bottomSheet;
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (_, constraints) => ProviderScope(
          overrides: [
            timelineArgsProvider.overrideWith(
              (ref) => TimelineArgs(
                maxWidth: constraints.maxWidth,
                maxHeight: constraints.maxHeight,
                columnCount: ref.watch(
                  settingsProvider.select((s) => s.get(Setting.tilesPerRow)),
                ),
                showStorageIndicator: showStorageIndicator,
              ),
            ),
          ],
          child: _SliverTimeline(
            topSliverWidget: topSliverWidget,
            topSliverWidgetHeight: topSliverWidgetHeight,
            appBar: appBar,
            bottomSheet: bottomSheet,
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
  });

  final Widget? topSliverWidget;
  final double? topSliverWidgetHeight;
  final Widget? appBar;
  final Widget? bottomSheet;

  @override
  ConsumerState createState() => _SliverTimelineState();
}

class _SliverTimelineState extends ConsumerState<_SliverTimeline> {
  final _scrollController = ScrollController();
  StreamSubscription? _reloadSubscription;

  @override
  void initState() {
    super.initState();
    _reloadSubscription =
        EventStream.shared.listen<TimelineReloadEvent>((_) => setState(() {}));
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _reloadSubscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext _) {
    final asyncSegments = ref.watch(timelineSegmentProvider);
    final maxHeight =
        ref.watch(timelineArgsProvider.select((args) => args.maxHeight));
    final isSelectionMode = ref.watch(
      multiSelectProvider.select((s) => s.forceEnable),
    );

    return asyncSegments.widgetWhen(
      onData: (segments) {
        final childCount = (segments.lastOrNull?.lastIndex ?? -1) + 1;
        final statusBarHeight = context.padding.top;
        final double appBarExpandedHeight =
            widget.appBar != null && widget.appBar is MesmerizingSliverAppBar
                ? 200
                : 0;
        final totalAppBarHeight = statusBarHeight + kToolbarHeight;
        const scrubberBottomPadding = 100.0;

        return PrimaryScrollController(
          controller: _scrollController,
          child: Stack(
            children: [
              Scrubber(
                layoutSegments: segments,
                timelineHeight: maxHeight,
                topPadding: totalAppBarHeight + 10,
                bottomPadding: context.padding.bottom + scrubberBottomPadding,
                monthSegmentSnappingOffset:
                    widget.topSliverWidgetHeight ?? 0 + appBarExpandedHeight,
                child: CustomScrollView(
                  primary: true,
                  cacheExtent: maxHeight * 2,
                  slivers: [
                    if (isSelectionMode)
                      const SelectionSliverAppBar()
                    else
                      widget.appBar ??
                          const ImmichSliverAppBar(
                            floating: true,
                            pinned: false,
                            snap: false,
                          ),
                    if (widget.topSliverWidget != null) widget.topSliverWidget!,
                    _SliverSegmentedList(
                      segments: segments,
                      delegate: SliverChildBuilderDelegate(
                        (ctx, index) {
                          if (index >= childCount) return null;
                          final segment = segments.findByIndex(index);
                          return segment?.builder(ctx, index) ??
                              const SizedBox.shrink();
                        },
                        childCount: childCount,
                        addAutomaticKeepAlives: false,
                        // We add repaint boundary around tiles, so skip the auto boundaries
                        addRepaintBoundaries: false,
                      ),
                    ),
                    const SliverPadding(
                      padding: EdgeInsets.only(
                        bottom: scrubberBottomPadding,
                      ),
                    ),
                  ],
                ),
              ),
              if (!isSelectionMode) ...[
                Consumer(
                  builder: (_, consumerRef, child) {
                    final isMultiSelectEnabled = consumerRef.watch(
                      multiSelectProvider.select(
                        (s) => s.isEnabled,
                      ),
                    );

                    if (isMultiSelectEnabled) {
                      return child!;
                    }
                    return const SizedBox.shrink();
                  },
                  child: const Positioned(
                    top: 60,
                    left: 25,
                    child: _MultiSelectStatusButton(),
                  ),
                ),
                Consumer(
                  builder: (_, consumerRef, child) {
                    final isMultiSelectEnabled = consumerRef.watch(
                      multiSelectProvider.select(
                        (s) => s.isEnabled,
                      ),
                    );

                    if (isMultiSelectEnabled) {
                      return child!;
                    }
                    return const SizedBox.shrink();
                  },
                  child: widget.bottomSheet,
                ),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _SliverSegmentedList extends SliverMultiBoxAdaptorWidget {
  final List<Segment> _segments;

  const _SliverSegmentedList({
    required List<Segment> segments,
    required super.delegate,
  }) : _segments = segments;

  @override
  _RenderSliverTimelineBoxAdaptor createRenderObject(BuildContext context) =>
      _RenderSliverTimelineBoxAdaptor(
        childManager: context as SliverMultiBoxAdaptorElement,
        segments: _segments,
      );

  @override
  void updateRenderObject(
    BuildContext context,
    _RenderSliverTimelineBoxAdaptor renderObject,
  ) {
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

  _RenderSliverTimelineBoxAdaptor({
    required super.childManager,
    required List<Segment> segments,
  }) : _segments = segments;

  int getMinChildIndexForScrollOffset(double offset) =>
      _segments.findByOffset(offset)?.getMinChildIndexForScrollOffset(offset) ??
      0;

  int getMaxChildIndexForScrollOffset(double offset) =>
      _segments.findByOffset(offset)?.getMaxChildIndexForScrollOffset(offset) ??
      0;

  double indexToLayoutOffset(int index) =>
      (_segments.findByIndex(index) ?? _segments.lastOrNull)
          ?.indexToLayoutOffset(index) ??
      0;

  double estimateMaxScrollOffset() => _segments.lastOrNull?.endOffset ?? 0;

  double computeMaxScrollOffset() => _segments.lastOrNull?.endOffset ?? 0;

  @override
  void performLayout() {
    childManager.didStartLayout();
    // Assume initially that we have enough children to fill the viewport/cache area.
    childManager.setDidUnderflow(false);

    final double scrollOffset =
        constraints.scrollOffset + constraints.cacheOrigin;
    assert(scrollOffset >= 0.0);

    final double remainingExtent = constraints.remainingCacheExtent;
    assert(remainingExtent >= 0.0);

    final double targetScrollOffset = scrollOffset + remainingExtent;

    // Find the index of the first child that should be visible or in the leading cache area.
    final int firstRequiredChildIndex =
        getMinChildIndexForScrollOffset(scrollOffset);

    // Find the index of the last child that should be visible or in the trailing cache area.
    final int? lastRequiredChildIndex = targetScrollOffset.isFinite
        ? getMaxChildIndexForScrollOffset(targetScrollOffset)
        : null;

    // Remove children that are no longer visible or within the cache area.
    if (firstChild == null) {
      collectGarbage(0, 0);
    } else {
      final int leadingChildrenToRemove =
          calculateLeadingGarbage(firstIndex: firstRequiredChildIndex);
      final int trailingChildrenToRemove = lastRequiredChildIndex == null
          ? 0
          : calculateTrailingGarbage(lastIndex: lastRequiredChildIndex);
      collectGarbage(leadingChildrenToRemove, trailingChildrenToRemove);
    }

    // If there are currently no children laid out (e.g., initial load),
    // try to add the first child needed for the current scroll offset.
    if (firstChild == null) {
      final double firstChildLayoutOffset =
          indexToLayoutOffset(firstRequiredChildIndex);
      final bool childAdded = addInitialChild(
        index: firstRequiredChildIndex,
        layoutOffset: firstChildLayoutOffset,
      );

      if (!childAdded) {
        // There are either no children, or we are past the end of all our children.
        final double max =
            firstRequiredChildIndex <= 0 ? 0.0 : computeMaxScrollOffset();
        geometry = SliverGeometry(scrollExtent: max, maxPaintExtent: max);
        childManager.didFinishLayout();
        return;
      }
    }

    // Layout children that might have scrolled into view from the top (before the current firstChild).
    RenderBox? highestLaidOutChild;
    final childConstraints = constraints.asBoxConstraints();

    for (int currentIndex = indexOf(firstChild!) - 1;
        currentIndex >= firstRequiredChildIndex;
        --currentIndex) {
      final RenderBox? newLeadingChild =
          insertAndLayoutLeadingChild(childConstraints);
      if (newLeadingChild == null) {
        // If a child is missing where we expect one, it indicates
        // an inconsistency in offset that needs correction.
        final Segment? segment =
            _segments.findByIndex(currentIndex) ?? _segments.firstOrNull;
        geometry = SliverGeometry(
          // Request a scroll correction based on where the missing child should have been.
          scrollOffsetCorrection:
              segment?.indexToLayoutOffset(currentIndex) ?? 0.0,
        );
        // Parent will re-layout everything.
        return;
      }
      final childParentData =
          newLeadingChild.parentData! as SliverMultiBoxAdaptorParentData;
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
      final childParentData =
          firstChild!.parentData! as SliverMultiBoxAdaptorParentData;
      childParentData.layoutOffset =
          indexToLayoutOffset(firstRequiredChildIndex);
      highestLaidOutChild = firstChild;
    }

    RenderBox? mostRecentlyLaidOutChild = highestLaidOutChild;

    // Starting from the child after [mostRecentlyLaidOutChild], layout subsequent children
    // until we reach the [lastRequiredChildIndex] or run out of children.
    double calculatedMaxScrollOffset = double.infinity;

    for (int currentIndex = indexOf(mostRecentlyLaidOutChild!) + 1;
        lastRequiredChildIndex == null ||
            currentIndex <= lastRequiredChildIndex;
        ++currentIndex) {
      RenderBox? child = childAfter(mostRecentlyLaidOutChild!);

      if (child == null || indexOf(child) != currentIndex) {
        child = insertAndLayoutChild(
          childConstraints,
          after: mostRecentlyLaidOutChild,
        );
        if (child == null) {
          final Segment? segment =
              _segments.findByIndex(currentIndex) ?? _segments.lastOrNull;
          calculatedMaxScrollOffset =
              segment?.indexToLayoutOffset(currentIndex) ??
                  computeMaxScrollOffset();
          break;
        }
      } else {
        child.layout(childConstraints);
      }

      mostRecentlyLaidOutChild = child;
      final childParentData = mostRecentlyLaidOutChild.parentData!
          as SliverMultiBoxAdaptorParentData;
      assert(childParentData.index == currentIndex);
      childParentData.layoutOffset = indexToLayoutOffset(currentIndex);
    }

    final int lastLaidOutChildIndex = indexOf(lastChild!);
    final double leadingScrollOffset =
        indexToLayoutOffset(firstRequiredChildIndex);
    final double trailingScrollOffset =
        indexToLayoutOffset(lastLaidOutChildIndex + 1);

    assert(
      firstRequiredChildIndex == 0 ||
          (childScrollOffset(firstChild!) ?? -1.0) - scrollOffset <=
              precisionErrorTolerance,
    );
    assert(debugAssertChildListIsNonEmptyAndContiguous());
    assert(indexOf(firstChild!) == firstRequiredChildIndex);
    assert(
      lastRequiredChildIndex == null ||
          lastLaidOutChildIndex <= lastRequiredChildIndex,
    );

    calculatedMaxScrollOffset = math.min(
      calculatedMaxScrollOffset,
      estimateMaxScrollOffset(),
    );

    final double paintExtent = calculatePaintOffset(
      constraints,
      from: leadingScrollOffset,
      to: trailingScrollOffset,
    );

    final double cacheExtent = calculateCacheOffset(
      constraints,
      from: leadingScrollOffset,
      to: trailingScrollOffset,
    );

    final double targetEndScrollOffsetForPaint =
        constraints.scrollOffset + constraints.remainingPaintExtent;
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
      hasVisualOverflow: (targetLastIndexForPaint != null &&
              lastLaidOutChildIndex >= targetLastIndexForPaint) ||
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
    final selectCount =
        ref.watch(multiSelectProvider.select((s) => s.selectedAssets.length));
    return ElevatedButton.icon(
      onPressed: () => ref.read(multiSelectProvider.notifier).reset(),
      icon: Icon(
        Icons.close_rounded,
        color: context.colorScheme.onPrimary,
      ),
      label: Text(
        selectCount.toString(),
        style: context.textTheme.titleMedium?.copyWith(
          height: 2.5,
          color: context.colorScheme.onPrimary,
        ),
      ),
    );
  }
}
