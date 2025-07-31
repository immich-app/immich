import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

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
  double? topScrollOffset;
  double? bottomScrollOffset;
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
    if (box == null) return null;

    final hitTestResult = BoxHitTestResult();
    final local = box.globalToLocal(position);
    if (!box.hitTest(hitTestResult, position: local)) return null;

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
    if (initialHit == null) return;

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
    if (anchorAsset == null) return;
    if (topScrollOffset == null || bottomScrollOffset == null) return;

    final currentDy = event.localPosition.dy;

    if (currentDy > bottomScrollOffset!) {
      scrollTimer ??= Timer.periodic(
        const Duration(milliseconds: 50),
        (_) => widget.onScroll?.call(ScrollDirection.forward),
      );
    } else if (currentDy < topScrollOffset!) {
      scrollTimer ??= Timer.periodic(
        const Duration(milliseconds: 50),
        (_) => widget.onScroll?.call(ScrollDirection.reverse),
      );
    } else {
      scrollTimer?.cancel();
      scrollTimer = null;
    }

    final currentlyTouchingAsset = _getValueKeyAtPosition(event.globalPosition);
    if (currentlyTouchingAsset == null) return;

    if (assetUnderPointer != currentlyTouchingAsset) {
      if (!scrollNotified) {
        scrollNotified = true;
        widget.onScrollStart?.call();
      }

      widget.onAssetEnter?.call(currentlyTouchingAsset);
      assetUnderPointer = currentlyTouchingAsset;
    }
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

class TimelineAssetIndex {
  final int assetIndex;
  final int segmentIndex;

  const TimelineAssetIndex({required this.assetIndex, required this.segmentIndex});

  @override
  bool operator ==(covariant TimelineAssetIndex other) {
    if (identical(this, other)) return true;

    return other.assetIndex == assetIndex && other.segmentIndex == segmentIndex;
  }

  @override
  int get hashCode => assetIndex.hashCode ^ segmentIndex.hashCode;
}
