import 'dart:async';

import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'timeline_drag_region.freezed.dart';

class TimelineDragRegion extends StatefulWidget {
  final Widget child;

  final void Function(TimelineAssetIndex valueKey)? onStart;
  final void Function(TimelineAssetIndex valueKey)? onAssetEnter;
  final void Function()? onEnd;
  final void Function()? onScrollStart;
  final void Function(ScrollDirection direction)? onScroll;
  final TimelineAssetIndex? Function(Offset position)? assetAt;

  const TimelineDragRegion({
    super.key,
    required this.child,
    this.onStart,
    this.onAssetEnter,
    this.onEnd,
    this.onScrollStart,
    this.onScroll,
    this.assetAt,
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
  late Offset pointerPosition;
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

  void _onLongPressStart(LongPressStartDetails event) {
    /// Calculate widget height and scroll offset when long press starting instead of in [initState]
    /// or [didChangeDependencies] as the grid might still be rendering into view to get the actual size
    final height = context.size?.height;
    if (height != null && (topScrollOffset == null || bottomScrollOffset == null)) {
      topScrollOffset = height * scrollOffset;
      bottomScrollOffset = height - topScrollOffset!;
    }

    final initialHit = widget.assetAt?.call(event.globalPosition);
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

    if (currentDy > bottomScrollOffset!) {
      scrollTimer ??= _startAutoScroll(ScrollDirection.forward);
    } else if (currentDy < topScrollOffset!) {
      scrollTimer ??= _startAutoScroll(ScrollDirection.reverse);
    } else {
      scrollTimer?.cancel();
      scrollTimer = null;
    }

    _enterAssetUnderPointer();
  }

  Timer _startAutoScroll(ScrollDirection direction) {
    return Timer.periodic(const Duration(milliseconds: 50), (_) {
      widget.onScroll?.call(direction);
      // the rows move under a finger that is holding still, so the selection has to follow them
      _enterAssetUnderPointer();
    });
  }

  void _enterAssetUnderPointer() {
    final currentlyTouchingAsset = widget.assetAt?.call(pointerPosition);
    if (currentlyTouchingAsset == null) {
      return;
    }

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

@freezed
abstract class TimelineAssetIndex with _$TimelineAssetIndex {
  const factory TimelineAssetIndex({required int assetIndex, required int segmentIndex}) = _TimelineAssetIndex;
}
