import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:immich_mobile/providers/haptic_feedback.provider.dart';
import 'package:immich_mobile/utils/debounce.dart';
import 'package:intl/intl.dart' hide TextDirection;

/// A widget that will display a BoxScrollView with a ScrollThumb that can be dragged
/// for quick navigation of the BoxScrollView.
class Scrubber extends ConsumerStatefulWidget {
  /// The view that will be scrolled with the scroll thumb
  final CustomScrollView child;

  /// The segments of the timeline
  final List<Segment> layoutSegments;

  final double timelineHeight;

  final double topPadding;

  final double bottomPadding;

  final double? monthSegmentSnappingOffset;

  Scrubber({
    super.key,
    Key? scrollThumbKey,
    required this.layoutSegments,
    required this.timelineHeight,
    this.topPadding = 0,
    this.bottomPadding = 0,
    this.monthSegmentSnappingOffset,
    required this.child,
  }) : assert(child.scrollDirection == Axis.vertical);

  @override
  ConsumerState createState() => ScrubberState();
}

List<_Segment> _buildSegments({required List<Segment> layoutSegments, required double timelineHeight}) {
  const double offsetThreshold = 40.0;

  final segments = <_Segment>[];
  if (layoutSegments.isEmpty || layoutSegments.first.bucket is! TimeBucket) {
    return [];
  }

  final formatter = DateFormat.yMMM();
  DateTime? lastDate;
  double lastOffset = -offsetThreshold;
  for (final layoutSegment in layoutSegments) {
    final scrollPercentage = layoutSegment.startOffset / layoutSegments.last.endOffset;
    final startOffset = scrollPercentage * timelineHeight;

    final date = (layoutSegment.bucket as TimeBucket).date;
    final label = formatter.format(date);

    final showSegment = lastOffset + offsetThreshold <= startOffset && (lastDate == null || date.year != lastDate.year);

    segments.add(_Segment(date: date, startOffset: startOffset, scrollLabel: label, showSegment: showSegment));
    lastDate = date;
    if (showSegment) {
      lastOffset = startOffset;
    }
  }

  return segments;
}

class ScrubberState extends ConsumerState<Scrubber> with TickerProviderStateMixin {
  String? _lastLabel;
  double _thumbTopOffset = 0.0;
  bool _isDragging = false;
  List<_Segment> _segments = [];
  int _monthCount = 0;
  DateTime? _currentScrubberDate;
  Debouncer? _scrubberDebouncer;

  late AnimationController _thumbAnimationController;
  Timer? _fadeOutTimer;
  late Animation<double> _thumbAnimation;

  late AnimationController _labelAnimationController;
  late Animation<double> _labelAnimation;

  double get _scrubberHeight => widget.timelineHeight - widget.topPadding - widget.bottomPadding;

  late ScrollController _scrollController;

  double get _currentOffset {
    if (_scrollController.hasClients != true) return 0.0;

    return _scrollController.offset * _scrubberHeight / _scrollController.position.maxScrollExtent;
  }

  @override
  void initState() {
    super.initState();
    _isDragging = false;
    _segments = _buildSegments(layoutSegments: widget.layoutSegments, timelineHeight: _scrubberHeight);
    _thumbAnimationController = AnimationController(vsync: this, duration: kTimelineScrubberFadeInDuration);
    _thumbAnimation = CurvedAnimation(parent: _thumbAnimationController, curve: Curves.fastEaseInToSlowEaseOut);
    _labelAnimationController = AnimationController(vsync: this, duration: kTimelineScrubberFadeInDuration);
    _monthCount = getMonthCount();

    _labelAnimation = CurvedAnimation(parent: _labelAnimationController, curve: Curves.fastOutSlowIn);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scrollController = PrimaryScrollController.of(context);
  }

  @override
  void didUpdateWidget(covariant Scrubber oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.layoutSegments.lastOrNull?.endOffset != widget.layoutSegments.lastOrNull?.endOffset) {
      _segments = _buildSegments(layoutSegments: widget.layoutSegments, timelineHeight: _scrubberHeight);
      _monthCount = getMonthCount();
    }
  }

  @override
  void dispose() {
    _thumbAnimationController.dispose();
    _labelAnimationController.dispose();
    _fadeOutTimer?.cancel();
    _scrubberDebouncer?.dispose();
    super.dispose();
  }

  void _resetThumbTimer() {
    _fadeOutTimer?.cancel();
    _fadeOutTimer = Timer(kTimelineScrubberFadeOutDuration, () {
      _thumbAnimationController.reverse();
      _fadeOutTimer = null;
    });
  }

  int getMonthCount() {
    return _segments.map((e) => "${e.date.month}_${e.date.year}").toSet().length;
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (_isDragging) {
      // If the user is dragging the thumb, we don't want to update the position
      return false;
    }

    if (notification is ScrollStartNotification || notification is ScrollUpdateNotification) {
      ref.read(timelineStateProvider.notifier).setScrolling(true);
    } else if (notification is ScrollEndNotification) {
      ref.read(timelineStateProvider.notifier).setScrolling(false);
    }

    setState(() {
      if (notification is ScrollUpdateNotification) {
        _thumbTopOffset = _currentOffset;
        if (_labelAnimation.status != AnimationStatus.reverse) {
          _labelAnimationController.reverse();
        }
        if (_thumbAnimationController.status != AnimationStatus.forward) {
          _thumbAnimationController.forward();
        }
      }
      _resetThumbTimer();
    });

    return false;
  }

  void _onScrubberDateChanged(DateTime date) {
    if (_currentScrubberDate != date) {
      // Date changed, immediately set scrubbing to true
      _currentScrubberDate = date;
      ref.read(timelineStateProvider.notifier).setScrubbing(true);

      // Initialize debouncer if needed
      _scrubberDebouncer ??= Debouncer(interval: const Duration(milliseconds: 50));

      // Debounce setting scrubbing to false
      _scrubberDebouncer!.run(() {
        if (_currentScrubberDate == date) {
          ref.read(timelineStateProvider.notifier).setScrubbing(false);
        }
      });
    }
  }

  void _onDragStart(DragStartDetails _) {
    setState(() {
      _isDragging = true;
      _labelAnimationController.forward();
      _fadeOutTimer?.cancel();
      _lastLabel = null;
    });
  }

  void _onDragUpdate(DragUpdateDetails details) {
    if (!_isDragging) {
      return;
    }

    if (_thumbAnimationController.status != AnimationStatus.forward) {
      _thumbAnimationController.forward();
    }

    final dragPosition = _calculateDragPosition(details);
    final nearestMonthSegment = _findNearestMonthSegment(dragPosition);

    if (nearestMonthSegment != null) {
      final label = nearestMonthSegment.scrollLabel;
      if (_lastLabel != label) {
        ref.read(hapticFeedbackProvider.notifier).selectionClick();
        _lastLabel = label;

        // Notify timeline state of the new scrubber date position
        if (_monthCount >= kMinMonthsToEnableScrubberSnap) {
          _onScrubberDateChanged(nearestMonthSegment.date);
        }
      }
    }

    if (_monthCount < kMinMonthsToEnableScrubberSnap) {
      // If there are less than kMinMonthsToEnableScrubberSnap months, we don't need to snap to segments
      setState(() {
        _thumbTopOffset = dragPosition;
        _scrollController.jumpTo((dragPosition / _scrubberHeight) * _scrollController.position.maxScrollExtent);
      });
    } else if (nearestMonthSegment != null) {
      _snapToSegment(nearestMonthSegment);
    }
  }

  /// Calculate the drag position relative to the scrubber area
  ///
  /// This method converts the global drag coordinates from the gesture detector
  /// into a position relative to the scrubber's active area (excluding padding).
  ///
  /// The scrubber has padding at the top and bottom, so we need to:
  /// 1. Calculate the actual draggable area (timelineHeight - topPadding - bottomPadding)
  /// 2. Convert the global Y position to a position within this draggable area
  /// 3. Clamp the result to ensure it stays within bounds (0 to dragAreaHeight)
  ///
  /// Example:
  /// - If timelineHeight = 800, topPadding = 50, bottomPadding = 50
  /// - Then dragAreaHeight = 700 (the actual scrubber area)
  /// - If user drags to global Y position that's 100 pixels from the top
  /// - The relative position would be 100 - 50 = 50 (50 pixels into the scrubber area)
  double _calculateDragPosition(DragUpdateDetails details) {
    final dragAreaTop = widget.topPadding;
    final dragAreaBottom = widget.timelineHeight - widget.bottomPadding;
    final dragAreaHeight = dragAreaBottom - dragAreaTop;

    final relativePosition = details.globalPosition.dy - dragAreaTop;

    // Make sure the position stays within the scrubber's bounds
    return relativePosition.clamp(0.0, dragAreaHeight);
  }

  /// Find the segment closest to the given position
  _Segment? _findNearestMonthSegment(double position) {
    _Segment? nearestSegment;
    double minDistance = double.infinity;

    for (final segment in _segments) {
      final distance = (segment.startOffset - position).abs();
      if (distance < minDistance) {
        minDistance = distance;
        nearestSegment = segment;
      }
    }

    return nearestSegment;
  }

  /// Snap the scrubber thumb and scroll view to the given segment
  void _snapToSegment(_Segment segment) {
    setState(() {
      _thumbTopOffset = segment.startOffset;

      final layoutSegmentIndex = _findLayoutSegmentIndex(segment);

      if (layoutSegmentIndex >= 0) {
        _scrollToLayoutSegment(layoutSegmentIndex);
      }
    });
  }

  int _findLayoutSegmentIndex(_Segment segment) {
    return widget.layoutSegments.indexWhere((layoutSegment) {
      final bucket = layoutSegment.bucket as TimeBucket;
      return bucket.date.year == segment.date.year && bucket.date.month == segment.date.month;
    });
  }

  void _scrollToLayoutSegment(int layoutSegmentIndex) {
    final layoutSegment = widget.layoutSegments[layoutSegmentIndex];
    final maxScrollExtent = _scrollController.position.maxScrollExtent;
    final viewportHeight = _scrollController.position.viewportDimension;

    final targetScrollOffset = layoutSegment.startOffset;
    final centeredOffset = targetScrollOffset - (viewportHeight / 4) + 100 + (widget.monthSegmentSnappingOffset ?? 0.0);

    _scrollController.jumpTo(centeredOffset.clamp(0.0, maxScrollExtent));
  }

  void _onDragEnd(DragEndDetails _) {
    _labelAnimationController.reverse();
    setState(() {
      _isDragging = false;
    });

    ref.read(timelineStateProvider.notifier).setScrubbing(false);

    // Reset scrubber tracking when drag ends
    _currentScrubberDate = null;
    _scrubberDebouncer?.dispose();
    _scrubberDebouncer = null;

    _resetThumbTimer();
  }

  @override
  Widget build(BuildContext ctx) {
    Text? label;
    if (_scrollController.hasClients == true) {
      // Cache to avoid multiple calls to [_currentOffset]
      final scrollOffset = _currentOffset;
      final labelText =
          _segments.lastWhereOrNull((segment) => segment.startOffset <= scrollOffset)?.scrollLabel ??
          _segments.firstOrNull?.scrollLabel;
      label = labelText != null
          ? Text(
              labelText,
              style: ctx.textTheme.bodyLarge?.copyWith(color: Colors.white, fontWeight: FontWeight.bold),
            )
          : null;
    }

    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: Stack(
        children: [
          RepaintBoundary(child: widget.child),
          // Scroll Segments - wrapped in RepaintBoundary for better performance
          RepaintBoundary(
            child: _SegmentsLayer(
              key: ValueKey('segments_${_isDragging}_${_segments.length}'),
              segments: _segments,
              topPadding: widget.topPadding,
              isDragging: _isDragging,
            ),
          ),
          if (_scrollController.hasClients && _scrollController.position.maxScrollExtent > 0)
            PositionedDirectional(
              top: _thumbTopOffset + widget.topPadding,
              end: 0,
              child: RepaintBoundary(
                child: GestureDetector(
                  onVerticalDragStart: _onDragStart,
                  onVerticalDragUpdate: _onDragUpdate,
                  onVerticalDragEnd: _onDragEnd,
                  child: _Scrubber(thumbAnimation: _thumbAnimation, labelAnimation: _labelAnimation, label: label),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

class _SegmentsLayer extends StatelessWidget {
  final List<_Segment> segments;
  final double topPadding;
  final bool isDragging;

  const _SegmentsLayer({super.key, required this.segments, required this.topPadding, required this.isDragging});

  @override
  Widget build(BuildContext context) {
    return Visibility(
      visible: isDragging,
      child: Stack(
        children: segments
            .where((segment) => segment.showSegment)
            .map(
              (segment) => PositionedDirectional(
                key: ValueKey('segment_${segment.date.millisecondsSinceEpoch}'),
                top: topPadding + segment.startOffset,
                end: 100,
                child: RepaintBoundary(child: _SegmentWidget(segment)),
              ),
            )
            .toList(),
      ),
    );
  }
}

class _SegmentWidget extends StatelessWidget {
  final _Segment _segment;

  const _SegmentWidget(this._segment);

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: Container(
        margin: const EdgeInsets.only(right: 36.0),
        child: Material(
          color: context.colorScheme.surface,
          borderRadius: const BorderRadius.all(Radius.circular(16.0)),
          child: Container(
            constraints: const BoxConstraints(maxHeight: 28),
            padding: const EdgeInsets.symmetric(horizontal: 10.0),
            alignment: Alignment.center,
            child: Text(
              _segment.date.year.toString(),
              style: context.textTheme.labelMedium?.copyWith(fontFamily: "OverpassMono", fontWeight: FontWeight.w600),
            ),
          ),
        ),
      ),
    );
  }
}

class _ScrollLabel extends StatelessWidget {
  final Text label;
  final Color backgroundColor;
  final Animation<double> animation;

  const _ScrollLabel({required this.label, required this.backgroundColor, required this.animation});

  @override
  Widget build(BuildContext context) {
    return IgnorePointer(
      child: FadeTransition(
        opacity: animation,
        child: Container(
          margin: const EdgeInsets.only(right: 12.0),
          child: Material(
            elevation: 4.0,
            color: backgroundColor,
            borderRadius: const BorderRadius.all(Radius.circular(16.0)),
            child: Container(
              constraints: const BoxConstraints(maxHeight: 28),
              padding: const EdgeInsets.symmetric(horizontal: 10.0),
              alignment: Alignment.center,
              child: label,
            ),
          ),
        ),
      ),
    );
  }
}

class _Scrubber extends StatelessWidget {
  final Text? label;
  final Animation<double> thumbAnimation;
  final Animation<double> labelAnimation;

  const _Scrubber({this.label, required this.thumbAnimation, required this.labelAnimation});

  @override
  Widget build(BuildContext context) {
    final backgroundColor = context.isDarkTheme
        ? context.colorScheme.primary.darken(amount: .5)
        : context.colorScheme.primary;

    return _SlideFadeTransition(
      animation: thumbAnimation,
      child: Row(
        mainAxisSize: MainAxisSize.min,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          if (label != null) _ScrollLabel(label: label!, backgroundColor: backgroundColor, animation: labelAnimation),
          _CircularThumb(backgroundColor),
        ],
      ),
    );
  }
}

class _CircularThumb extends StatelessWidget {
  final Color backgroundColor;

  const _CircularThumb(this.backgroundColor);

  @override
  Widget build(BuildContext context) {
    return CustomPaint(
      foregroundPainter: const _ArrowPainter(Colors.white),
      child: Material(
        elevation: 4.0,
        color: backgroundColor,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(48.0),
          bottomLeft: Radius.circular(48.0),
          topRight: Radius.circular(4.0),
          bottomRight: Radius.circular(4.0),
        ),
        child: Container(constraints: BoxConstraints.tight(const Size(48.0 * 0.6, 48.0))),
      ),
    );
  }
}

class _ArrowPainter extends CustomPainter {
  final Color color;

  const _ArrowPainter(this.color);

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..color = color;
    const width = 12.0;
    const height = 8.0;
    final baseX = size.width / 2;
    final baseY = size.height / 2;

    canvas.drawPath(_trianglePath(Offset(baseX, baseY - 2.0), width, height, true), paint);
    canvas.drawPath(_trianglePath(Offset(baseX, baseY + 2.0), width, height, false), paint);
  }

  static Path _trianglePath(Offset o, double width, double height, bool isUp) {
    return Path()
      ..moveTo(o.dx, o.dy)
      ..lineTo(o.dx + width, o.dy)
      ..lineTo(o.dx + (width / 2), isUp ? o.dy - height : o.dy + height)
      ..close();
  }
}

class _SlideFadeTransition extends StatelessWidget {
  final Animation<double> _animation;
  final Widget _child;

  const _SlideFadeTransition({required Animation<double> animation, required Widget child})
    : _animation = animation,
      _child = child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) => _animation.value == 0.0 ? const SizedBox() : child!,
      child: SlideTransition(
        position: Tween(begin: const Offset(0.3, 0.0), end: const Offset(0.0, 0.0)).animate(_animation),
        child: FadeTransition(opacity: _animation, child: _child),
      ),
    );
  }
}

class _Segment {
  final DateTime date;
  final double startOffset;
  final String scrollLabel;
  final bool showSegment;

  const _Segment({required this.date, required this.startOffset, required this.scrollLabel, this.showSegment = false});

  _Segment copyWith({DateTime? date, double? startOffset, String? scrollLabel, bool? showSegment}) {
    return _Segment(
      date: date ?? this.date,
      startOffset: startOffset ?? this.startOffset,
      scrollLabel: scrollLabel ?? this.scrollLabel,
      showSegment: showSegment ?? this.showSegment,
    );
  }

  @override
  String toString() {
    return 'Segment(scrollLabel: $scrollLabel, date: $date)';
  }
}
