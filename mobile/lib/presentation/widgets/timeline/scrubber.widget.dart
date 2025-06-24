import 'dart:async';

import 'package:collection/collection.dart';
import 'package:flutter/material.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:immich_mobile/presentation/widgets/timeline/timeline.state.dart';
import 'package:intl/intl.dart' hide TextDirection;

/// A widget that will display a BoxScrollView with a ScrollThumb that can be dragged
/// for quick navigation of the BoxScrollView.
class Scrubber extends StatefulWidget {
  /// The view that will be scrolled with the scroll thumb
  final CustomScrollView child;

  /// The segments of the timeline
  final List<Segment> layoutSegments;

  final double timelineHeight;

  final double topPadding;

  final double bottomPadding;

  Scrubber({
    super.key,
    Key? scrollThumbKey,
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

  final formatter = DateFormat.yMMM();
  for (final layoutSegment in layoutSegments) {
    final scrollPercentage =
        layoutSegment.startOffset / layoutSegments.last.endOffset;
    final startOffset = scrollPercentage * timelineHeight;

    final date = (layoutSegment.bucket as TimeBucket).date;
    final label = formatter.format(date);

    segments.add(
      _Segment(
        date: date,
        startOffset: startOffset,
        scrollLabel: label,
      ),
    );
  }

  return segments;
}

class ScrubberState extends State<Scrubber> with TickerProviderStateMixin {
  double _thumbTopOffset = 0.0;
  bool _isDragging = false;
  List<_Segment> _segments = [];

  late AnimationController _thumbAnimationController;
  Timer? _fadeOutTimer;
  late Animation<double> _thumbAnimation;

  late AnimationController _labelAnimationController;
  late Animation<double> _labelAnimation;

  double get _scrubberHeight =>
      widget.timelineHeight - widget.topPadding - widget.bottomPadding;

  late final ScrollController _scrollController;

  double get _currentOffset =>
      _scrollController.offset *
      _scrubberHeight /
      _scrollController.position.maxScrollExtent;

  @override
  void initState() {
    super.initState();
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
    _labelAnimationController = AnimationController(
      vsync: this,
      duration: kTimelineScrubberFadeInDuration,
    );

    _labelAnimation = CurvedAnimation(
      parent: _labelAnimationController,
      curve: Curves.fastOutSlowIn,
    );
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _scrollController = PrimaryScrollController.of(context);
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
    _labelAnimationController.dispose();
    _fadeOutTimer?.cancel();
    super.dispose();
  }

  void _resetThumbTimer() {
    _fadeOutTimer?.cancel();
    _fadeOutTimer = Timer(kTimelineScrubberFadeOutDuration, () {
      _thumbAnimationController.reverse();
      _fadeOutTimer = null;
    });
  }

  bool _onScrollNotification(ScrollNotification notification) {
    if (_isDragging) {
      // If the user is dragging the thumb, we don't want to update the position
      return false;
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

  void _onDragStart(WidgetRef ref) {
    ref.read(timelineStateProvider.notifier).setScrubbing(true);
    setState(() {
      _isDragging = true;
      _labelAnimationController.forward();
      _fadeOutTimer?.cancel();
    });
  }

  void _onDragUpdate(DragUpdateDetails details) {
    if (!_isDragging) {
      return;
    }

    if (_thumbAnimationController.status != AnimationStatus.forward) {
      _thumbAnimationController.forward();
    }

    final newOffset =
        details.globalPosition.dy - widget.topPadding - widget.bottomPadding;

    setState(() {
      _thumbTopOffset = newOffset.clamp(0, _scrubberHeight);
      final scrollPercentage = _thumbTopOffset / _scrubberHeight;
      final maxScrollExtent = _scrollController.position.maxScrollExtent;
      _scrollController.jumpTo(maxScrollExtent * scrollPercentage);
    });
  }

  void _onDragEnd(WidgetRef ref) {
    ref.read(timelineStateProvider.notifier).setScrubbing(false);
    _labelAnimationController.reverse();
    _isDragging = false;
    _resetThumbTimer();
  }

  @override
  Widget build(BuildContext ctx) {
    Text? label;
    if (_scrollController.hasClients) {
      // Cache to avoid multiple calls to [_currentOffset]
      final scrollOffset = _currentOffset;
      final labelText = _segments
              .lastWhereOrNull(
                (segment) => segment.startOffset <= scrollOffset,
              )
              ?.scrollLabel ??
          _segments.firstOrNull?.scrollLabel;
      label = labelText != null
          ? Text(
              labelText,
              style: ctx.textTheme.bodyLarge?.copyWith(
                color: Colors.white,
                fontWeight: FontWeight.bold,
              ),
            )
          : null;
    }

    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: Stack(
        children: [
          RepaintBoundary(child: widget.child),
          PositionedDirectional(
            top: _thumbTopOffset + widget.topPadding,
            end: 0,
            child: Consumer(
              builder: (_, ref, child) => GestureDetector(
                onVerticalDragStart: (_) => _onDragStart(ref),
                onVerticalDragUpdate: _onDragUpdate,
                onVerticalDragEnd: (_) => _onDragEnd(ref),
                child: child,
              ),
              child: _Scrubber(
                thumbAnimation: _thumbAnimation,
                labelAnimation: _labelAnimation,
                label: label,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ScrollLabel extends StatelessWidget {
  final Text label;
  final Color backgroundColor;
  final Animation<double> animation;

  const _ScrollLabel({
    required this.label,
    required this.backgroundColor,
    required this.animation,
  });

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

  const _Scrubber({
    this.label,
    required this.thumbAnimation,
    required this.labelAnimation,
  });

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
          if (label != null)
            _ScrollLabel(
              label: label!,
              backgroundColor: backgroundColor,
              animation: labelAnimation,
            ),
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
        child: Container(
          constraints: BoxConstraints.tight(const Size(48.0 * 0.6, 48.0)),
        ),
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

    canvas.drawPath(
      _trianglePath(Offset(baseX, baseY - 2.0), width, height, true),
      paint,
    );
    canvas.drawPath(
      _trianglePath(Offset(baseX, baseY + 2.0), width, height, false),
      paint,
    );
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

class _Segment {
  final DateTime date;
  final double startOffset;
  final String scrollLabel;

  const _Segment({
    required this.date,
    required this.startOffset,
    required this.scrollLabel,
  });

  _Segment copyWith({
    DateTime? date,
    double? startOffset,
    String? scrollLabel,
  }) {
    return _Segment(
      date: date ?? this.date,
      startOffset: startOffset ?? this.startOffset,
      scrollLabel: scrollLabel ?? this.scrollLabel,
    );
  }

  @override
  String toString() {
    return 'Segment(scrollLabel: $scrollLabel, date: $date)';
  }
}
