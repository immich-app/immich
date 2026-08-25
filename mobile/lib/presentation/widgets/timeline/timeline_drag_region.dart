import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:immich_mobile/presentation/widgets/timeline/fixed/row.dart';

part 'timeline_drag_region.freezed.dart';

class TimelineDragRegion extends StatefulWidget {
  final Widget child;

  final void Function(TimelineAssetIndex valueKey)? onStart;
  final void Function(TimelineAssetIndex valueKey)? onAssetEnter;
  final void Function()? onEnd;
  final void Function()? onScrollStart;
  final void Function(ScrollDirection direction)? onScroll;

  const TimelineDragRegion({
    super.key,
    required this.child,
    this.onStart,
    this.onAssetEnter,
    this.onEnd,
    this.onScrollStart,
    this.onScroll,
  });

  @override
  State createState() => _TimelineDragRegionState();
}

class _TimelineDragRegionState extends State<TimelineDragRegion> {
  late TimelineAssetIndex? assetUnderPointer;
  late TimelineAssetIndex? anchorAsset;

  // Scroll related state
  static const double scrollOffset = 0.10;
  static const int maxProbeSteps = 10;
  double? topScrollOffset;
  double? bottomScrollOffset;
  Offset? pointerPosition;
  Timer? scrollTimer;
  late bool scrollNotified;

  @override
  void initState() {
    super.initState();
    assetUnderPointer = null;
    anchorAsset = null;
    scrollNotified = false;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    topScrollOffset = null;
    bottomScrollOffset = null;
  }

  @override
  void dispose() {
    scrollTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return RawGestureDetector(
      gestures: {
        _CustomLongPressGestureRecognizer: GestureRecognizerFactoryWithHandlers<_CustomLongPressGestureRecognizer>(
          () => _CustomLongPressGestureRecognizer(),
          _registerCallbacks,
        ),
      },
      child: widget.child,
    );
  }

  void _registerCallbacks(_CustomLongPressGestureRecognizer recognizer) {
    recognizer.onLongPressMoveUpdate = (details) => _onLongPressMove(details);
    recognizer.onLongPressStart = (details) => _onLongPressStart(details);
    recognizer.onLongPressUp = _onLongPressEnd;
  }

  TimelineAssetIndex? _getValueKeyAtPosition(Offset position) {
    final box = context.findAncestorRenderObjectOfType<RenderBox>();
    if (box == null) {
      return null;
    }

    final hitTestResult = BoxHitTestResult();
    final local = box.globalToLocal(position);
    if (!box.hitTest(hitTestResult, position: local)) {
      return null;
    }

    return (hitTestResult.path.firstWhereOrNull((hit) => hit.target is _TimelineAssetIndexProxy)?.target
            as _TimelineAssetIndexProxy?)
        ?.index;
  }

  void _onLongPressStart(LongPressStartDetails event) {
    /// Calculate widget height and scroll offset when long press starting instead of in [initState]
    /// or [didChangeDependencies] as the grid might still be rendering into view to get the actual size
    final height = context.size?.height;
    if (height != null && (topScrollOffset == null || bottomScrollOffset == null)) {
      topScrollOffset = height * scrollOffset;
      bottomScrollOffset = height - topScrollOffset!;
    }

    final initialHit = _getValueKeyAtPosition(event.globalPosition);
    anchorAsset = initialHit;
    if (initialHit == null) {
      return;
    }

    if (anchorAsset != null) {
      widget.onStart?.call(anchorAsset!);
    }
  }

  void _onLongPressEnd() {
    scrollNotified = false;
    scrollTimer?.cancel();
    widget.onEnd?.call();
  }

  void _onLongPressMove(LongPressMoveUpdateDetails event) {
    if (anchorAsset == null) {
      return;
    }
    if (topScrollOffset == null || bottomScrollOffset == null) {
      return;
    }

    final currentDy = event.localPosition.dy;
    pointerPosition = event.globalPosition;

    ScrollDirection? autoScroll;
    if (currentDy > bottomScrollOffset!) {
      autoScroll = ScrollDirection.forward;
      scrollTimer ??= _startAutoScroll(autoScroll);
    } else if (currentDy < topScrollOffset!) {
      autoScroll = ScrollDirection.reverse;
      scrollTimer ??= _startAutoScroll(autoScroll);
    } else {
      scrollTimer?.cancel();
      scrollTimer = null;
    }

    _enterAssetUnderPointer(autoScroll);
  }

  Timer _startAutoScroll(ScrollDirection direction) {
    return Timer.periodic(const Duration(milliseconds: 50), (_) {
      widget.onScroll?.call(direction);
      // the rows move under a finger that is holding still, so the selection has to follow them
      _enterAssetUnderPointer(direction);
    });
  }

  TimelineAssetIndex? _assetAtHeight(Offset position) {
    return _getValueKeyAtPosition(position) ?? _nearestAssetInRow(position);
  }

  TimelineAssetIndex? _nearestAssetInRow(Offset position) {
    final row = _rowAt(context.findRenderObject()!, position);
    if (row == null) {
      return null;
    }

    final dx = row.globalToLocal(position).dx;
    var nearest = row.firstChild!;
    var nearestDistance = double.infinity;
    RenderBox? child = nearest;
    while (child != null) {
      final start = (child.parentData! as BoxParentData).offset.dx;
      final end = start + child.size.width;
      if (dx >= start && dx <= end) {
        nearest = child;
        break;
      }
      final distance = dx < start ? start - dx : dx - end;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearest = child;
      }
      child = row.childAfter(child);
    }
    return (nearest as _TimelineAssetIndexProxy).index;
  }

  RenderFixedRow? _rowAt(RenderObject node, Offset position) {
    if (node is RenderBox) {
      final dy = node.globalToLocal(position).dy;
      if (dy < 0 || dy >= node.size.height) {
        return null;
      }
      if (node is RenderFixedRow) {
        return node;
      }
    }

    RenderFixedRow? row;
    node.visitChildren((child) => row ??= _rowAt(child, position));
    return row;
  }

  void _enterAssetUnderPointer(ScrollDirection? autoScroll) {
    final position = pointerPosition;
    if (position == null) {
      return;
    }

    var currentlyTouchingAsset = _assetAtHeight(position);
    // in the scroll zones the pointer usually sits on the sheet or the app bar, so step back
    // towards the grid until a row answers
    if (currentlyTouchingAsset == null && autoScroll != null) {
      final step = topScrollOffset! / 2;
      final towardsGrid = autoScroll == ScrollDirection.forward ? -step : step;
      for (var i = 1; i <= maxProbeSteps; i++) {
        currentlyTouchingAsset = _assetAtHeight(position.translate(0, towardsGrid * i));
        if (currentlyTouchingAsset != null) {
          break;
        }
      }
    }

    if (currentlyTouchingAsset == null || currentlyTouchingAsset == assetUnderPointer) {
      return;
    }

    if (!scrollNotified) {
      scrollNotified = true;
      widget.onScrollStart?.call();
    }

    widget.onAssetEnter?.call(currentlyTouchingAsset);
    assetUnderPointer = currentlyTouchingAsset;
  }
}

class _CustomLongPressGestureRecognizer extends LongPressGestureRecognizer {
  @override
  void rejectGesture(int pointer) {
    acceptGesture(pointer);
  }
}

class TimelineAssetIndexWrapper extends SingleChildRenderObjectWidget {
  final int assetIndex;
  final int segmentIndex;

  const TimelineAssetIndexWrapper({
    required Widget super.child,
    required this.assetIndex,
    required this.segmentIndex,
    super.key,
  });

  @override
  // ignore: library_private_types_in_public_api
  _TimelineAssetIndexProxy createRenderObject(BuildContext context) {
    return _TimelineAssetIndexProxy(
      index: TimelineAssetIndex(assetIndex: assetIndex, segmentIndex: segmentIndex),
    );
  }

  @override
  void updateRenderObject(
    BuildContext context,
    // ignore: library_private_types_in_public_api
    _TimelineAssetIndexProxy renderObject,
  ) {
    renderObject.index = TimelineAssetIndex(assetIndex: assetIndex, segmentIndex: segmentIndex);
  }
}

class _TimelineAssetIndexProxy extends RenderProxyBox {
  TimelineAssetIndex index;

  _TimelineAssetIndexProxy({required this.index});
}

@freezed
abstract class TimelineAssetIndex with _$TimelineAssetIndex {
  const factory TimelineAssetIndex({required int assetIndex, required int segmentIndex}) = _TimelineAssetIndex;
}
