import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:intl/intl.dart' hide TextDirection;

/// A widget that will display a BoxScrollView with a ScrollThumb that can be dragged
/// for quick navigation of the BoxScrollView.
class Scrubber extends StatefulWidget {
  /// The view that will be scrolled with the scroll thumb
  final CustomScrollView child;

  /// The segments of the timeline
  final List<Segment> layoutSegments;

  /// The ScrollController for the BoxScrollView
  final ScrollController controller;

  final double timelineHeight;

  final double topPadding;

  final double bottomPadding;

  Scrubber({
    super.key,
    Key? scrollThumbKey,
    required this.controller,
    required this.layoutSegments,
    required this.timelineHeight,
    this.topPadding = 0,
    this.bottomPadding = 0,
    required this.child,
  }) : assert(child.scrollDirection == Axis.vertical);

  @override
  State createState() => ScrubberState();
}

List<_Segment> _buildSegments({
  required List<Segment> layoutSegments,
  required double timelineHeight,
}) {
  final segments = <_Segment>[];
  if (layoutSegments.isEmpty || layoutSegments.first.bucket is! TimeBucket) {
    return [];
  }

  _Segment? previousSegment;
  double previousOffset = -kTimelineScrubberPadding;
  final formatter = DateFormat.yMMM();
  for (final (i, layoutSegment) in layoutSegments.indexed) {
    final scrollPercentage =
        layoutSegment.startOffset / layoutSegments.last.endOffset;
    final startOffset = scrollPercentage * timelineHeight;
    if (startOffset < previousOffset + kTimelineScrubberPadding) {
      // Skip segments that are too close to the previous one
      continue;
    }
    previousOffset = startOffset;

    final date = (layoutSegment.bucket as TimeBucket).date;
    final label = formatter.format(date);

    _Segment segment = _Segment(
      date: date,
      startOffset: startOffset,
      hasDot: false,
      hasLabel: false,
      scrollLabel: label,
    );

    if (i == 0) {
      segments.add(segment.copyWith(hasDot: true, hasLabel: true));
      previousSegment = segment;
      continue;
    }

    if (previousSegment?.date.year == date.year) {
      segment = segment.copyWith(hasDot: true);
    } else {
      segment = segment.copyWith(hasDot: true, hasLabel: true);
      previousSegment = segment;
    }
    segments.add(segment);
  }

  return segments;
}

class ScrubberState extends State<Scrubber> with TickerProviderStateMixin {
  double _thumbTopOffset = 0.0;
  bool _isScrolling = false;
  bool _isDragging = false;
  List<_Segment> _segments = [];

  late AnimationController _thumbAnimationController;
  Timer? _thumbAnimationTimer;
  late Animation<double> _thumbAnimation;

  double get _scrubberHeight =>
      widget.timelineHeight - widget.topPadding - widget.bottomPadding;

  double get _currentOffset =>
      widget.controller.offset *
      _scrubberHeight /
      widget.controller.position.maxScrollExtent;

  @override
  void initState() {
    super.initState();
    _isScrolling = false;
    _isDragging = false;
    _segments = _buildSegments(
      layoutSegments: widget.layoutSegments,
      timelineHeight: _scrubberHeight,
    );
    _thumbAnimationController = AnimationController(
      vsync: this,
      duration: kTimelineScrubberFadeInDuration,
    );
    _thumbAnimation = CurvedAnimation(
      parent: _thumbAnimationController,
      curve: Curves.fastEaseInToSlowEaseOut,
    );
  }

  @override
  void didUpdateWidget(covariant Scrubber oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (oldWidget.layoutSegments.lastOrNull?.endOffset !=
        widget.layoutSegments.lastOrNull?.endOffset) {
      _segments = _buildSegments(
        layoutSegments: widget.layoutSegments,
        timelineHeight: _scrubberHeight,
      );
    }
  }

  @override
  void dispose() {
    _thumbAnimationController.dispose();
    _thumbAnimationTimer?.cancel();
    super.dispose();
  }

  void _resetThumbTimer() {
    _thumbAnimationTimer?.cancel();
    _thumbAnimationTimer = Timer(kTimelineScrubberFadeOutDuration, () {
      _thumbAnimationController.reverse();
      _thumbAnimationTimer = null;
      _isScrolling = false;
      _isDragging = false;
    });
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (_isDragging) {
      // If the user is dragging the thumb, we don't want to update the position
      return false;
    }

    setState(() {
      _isScrolling = true;
      if (notification is ScrollUpdateNotification) {
        _thumbTopOffset = _currentOffset;
        if (_thumbAnimationController.status != AnimationStatus.forward) {
          _thumbAnimationController.forward();
        }

        _resetThumbTimer();
      }
    });

    return false;
  }

  void _onDragStart(DragStartDetails _) {
    setState(() {
      _isDragging = true;
      _isScrolling = false;

      if (_thumbAnimationController.status != AnimationStatus.forward) {
        _thumbAnimationController.forward();
      }
      _thumbAnimationTimer?.cancel();
    });
  }

  void _onDragUpdate(DragUpdateDetails details) {
    final newOffset =
        details.globalPosition.dy - widget.topPadding - widget.bottomPadding;

    setState(() {
      _thumbTopOffset = newOffset.clamp(0, _scrubberHeight);
      final scrollPercentage = _thumbTopOffset / _scrubberHeight;
      final maxScrollExtent = widget.controller.position.maxScrollExtent;
      widget.controller.jumpTo(maxScrollExtent * scrollPercentage);
    });
  }

  void _onDragEnd(DragEndDetails _) {
    setState(() {
      _resetThumbTimer();
    });
  }

  @override
  Widget build(BuildContext ctx) {
    String? label;
    if (widget.controller.hasClients) {
      // Cache to avoid multiple calls to [_currentOffset]
      final scrollOffset = _currentOffset;
      label = _segments
          .lastWhereOrNull(
            (segment) => segment.startOffset <= scrollOffset,
          )
          ?.scrollLabel;
    }

    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: Stack(
        children: [
          RepaintBoundary(child: widget.child),
          // Gradient background
          if (_isScrolling || _isDragging)
            Positioned.directional(
              textDirection: Directionality.of(ctx),
              top: 0,
              end: -1,
              bottom: 0,
              child: IgnorePointer(
                child: FadeTransition(
                  opacity: _thumbAnimation,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerRight,
                        end: Alignment.centerLeft,
                        colors: [
                          Colors.black.withAlpha(100),
                          Colors.black.withAlpha(0),
                        ],
                      ),
                    ),
                    width: context.width * 0.50,
                  ),
                ),
              ),
            ),
          // Scroll Segments
          if (_isScrolling || _isDragging)
            for (final segment in _segments)
              Positioned.directional(
                textDirection: Directionality.of(ctx),
                top: widget.topPadding + segment.startOffset,
                end: 5,
                child: FadeTransition(
                  opacity: _thumbAnimation,
                  child: _SegmentWidget(segment),
                ),
              ),
          // Scroll Thumb
          Positioned.directional(
            textDirection: Directionality.of(ctx),
            top: _thumbTopOffset + widget.topPadding,
            end: 0,
            child: GestureDetector(
              onVerticalDragStart: _onDragStart,
              onVerticalDragUpdate: _onDragUpdate,
              onVerticalDragEnd: _onDragEnd,
              child: _Thumb(
                label: label,
                thumbAnimation: _thumbAnimation,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _Thumb extends StatelessWidget {
  final String? _label;
  final Animation<double> _thumbAnimation;

  const _Thumb({
    String? label,
    required Animation<double> thumbAnimation,
  })  : _label = label,
        _thumbAnimation = thumbAnimation;

  @override
  Widget build(BuildContext context) {
    final label = _label ?? ' ' * 18;

    return _SlideFadeTransition(
      animation: _thumbAnimation,
      child: Container(
        decoration: BoxDecoration(
          color: context.colorScheme.surface.withAlpha(230),
          border: Border(
            bottom: BorderSide(
              color: context.colorScheme.primary,
              width: 4.0,
            ),
          ),
          borderRadius: const BorderRadius.only(
            bottomLeft: Radius.circular(8.0),
            topLeft: Radius.circular(8.0),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.only(
            top: 6.0,
            left: 8.0,
            right: 8.0,
            bottom: 8.0,
          ),
          child: Text(
            label,
            style: context.textTheme.displayLarge?.copyWith(
              color: context.colorScheme.onSurface,
              fontWeight: FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}

class _SlideFadeTransition extends StatelessWidget {
  final Animation<double> _animation;
  final Widget _child;

  const _SlideFadeTransition({
    required Animation<double> animation,
    required Widget child,
  })  : _animation = animation,
        _child = child;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) =>
          _animation.value == 0.0 ? const SizedBox() : child!,
      child: SlideTransition(
        position: Tween(
          begin: const Offset(0.3, 0.0),
          end: const Offset(0.0, 0.0),
        ).animate(_animation),
        child: FadeTransition(
          opacity: _animation,
          child: _child,
        ),
      ),
    );
  }
}

class _SegmentWidget extends StatelessWidget {
  final _Segment _segment;

  const _SegmentWidget(this._segment);

  @override
  Widget build(BuildContext context) {
    const size = Size(10, 10);

    final dot = _segment.hasDot
        ? const CustomPaint(
            painter: _Dot(color: Colors.white, radius: 4.0),
            size: size,
          )
        : SizedBox.fromSize(size: size);

    final label = _segment.hasLabel
        ? Text(
            _segment.date.year.toString(),
            style: context.textTheme.bodyLarge?.copyWith(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w800,
            ),
          )
        : SizedBox.fromSize(size: size);

    final (first, second) = switch (Directionality.of(context)) {
      TextDirection.ltr => (label, dot),
      TextDirection.rtl => (dot, label),
    };

    return Row(spacing: 10, children: [first, second]);
  }
}

class _Dot extends CustomPainter {
  final Color _color;
  final double _radius;

  const _Dot({required Color color, required double radius})
      : _color = color,
        _radius = radius;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = _color
      ..strokeWidth = 5
      ..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);
    canvas.drawCircle(center, _radius, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _Segment {
  final DateTime date;
  final double startOffset;
  final bool hasDot;
  final bool hasLabel;
  final String scrollLabel;

  const _Segment({
    required this.date,
    required this.startOffset,
    required this.hasDot,
    required this.hasLabel,
    required this.scrollLabel,
  });

  _Segment copyWith({
    DateTime? date,
    double? startOffset,
    bool? hasDot,
    bool? hasLabel,
    String? scrollLabel,
  }) {
    return _Segment(
      date: date ?? this.date,
      startOffset: startOffset ?? this.startOffset,
      hasDot: hasDot ?? this.hasDot,
      hasLabel: hasLabel ?? this.hasLabel,
      scrollLabel: scrollLabel ?? this.scrollLabel,
    );
  }

  @override
  String toString() {
    return 'Segment(date: $date, startOffset: $startOffset)';
  }
}
