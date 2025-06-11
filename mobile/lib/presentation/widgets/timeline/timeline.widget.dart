import 'dart:math' as math;

import 'package:collection/collection.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/timeline.service.dart';
import 'package:immich_mobile/extensions/asyncvalue_extensions.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/scrubber.widget.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/infrastructure/setting.provider.dart';
import 'package:immich_mobile/providers/infrastructure/timeline.provider.dart';

class Timeline extends StatelessWidget {
  final bool showHeader;

  const Timeline({super.key, this.showHeader = true});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: LayoutBuilder(
        builder: (_, constraints) => ProviderScope(
          overrides: [
            timelineArgsProvider.overrideWith(
              (ref) => TimelineStateArgs(
                maxWidth: constraints.maxWidth,
                maxHeight: constraints.maxHeight,
                columnCount: ref.watch(
                  settingsProvider.select((s) => s.get(Setting.tilesPerRow)),
                ),
                showHeader: showHeader,
              ),
            ),
            timelineServiceProvider.overrideWith(
              (ref) => TimelineService(
                assetSource:
                    ref.watch(timelineRepositoryProvider).getLocalTimeBucket,
                bucketSource:
                    ref.watch(timelineRepositoryProvider).watchLocalTimeBuckets,
              ),
            ),
          ],
          child: const _SliverTimeline(),
        ),
      ),
    );
  }
}

class _SliverTimeline extends StatefulWidget {
  const _SliverTimeline();

  @override
  State createState() => _SliverTimelineState();
}

class _SliverTimelineState extends State<_SliverTimeline> {
  final _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext _) {
    return Consumer(
      builder: (context, ref, child) {
        final asyncSegments = ref.watch(timelineSegmentProvider);
        final maxHeight =
            ref.watch(timelineArgsProvider.select((args) => args.maxHeight));
        return asyncSegments.widgetWhen(
          onData: (segments) {
            final childCount = (segments.lastOrNull?.lastIndex ?? -1) + 1;

            return Scrubber(
              controller: _scrollController,
              layoutSegments: segments,
              timelineHeight: maxHeight,
              topPadding: context.padding.top + 10,
              bottomPadding: context.padding.bottom + 10,
              child: CustomScrollView(
                controller: _scrollController,
                slivers: [
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
                ],
              ),
            );
          },
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
