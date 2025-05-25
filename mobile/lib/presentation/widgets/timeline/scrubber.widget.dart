import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/timeline.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/presentation/widgets/timeline/segment.model.dart';
import 'package:intl/intl.dart' hide TextDirection;

/// Build a Text widget using the current scroll offset
typedef LabelTextBuilder = Text Function(double offsetY);

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

List<_ScrubberSegment> _buildSegments({
  required List<Segment> layoutSegments,
  required double timelineHeight,
}) {
  final segments = <_ScrubberSegment>[];
  if (layoutSegments.isEmpty || layoutSegments.first.bucket is! TimeBucket) {
    return [];
  }

  final maxLayoutOffset = layoutSegments.last.endOffset;

  _ScrubberSegment? previousSegment;
  final formatter = DateFormat.yMMM();
  for (final (i, layoutSegment) in layoutSegments.indexed) {
    final percentage = layoutSegment.startOffset / maxLayoutOffset;
    final startOffset = percentage * timelineHeight;
    final date = (layoutSegment.bucket as TimeBucket).date;
    final label = formatter.format(date);

    _ScrubberSegment segment = _ScrubberSegment(
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
  bool _isDragging = false;
  List<_ScrubberSegment> _segments = [];

  double get _scrubberHeight =>
      widget.timelineHeight - widget.topPadding - widget.bottomPadding;

  @override
  void initState() {
    super.initState();
    _isDragging = false;
    _segments = _buildSegments(
      layoutSegments: widget.layoutSegments,
      timelineHeight: _scrubberHeight,
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

  bool _onScrollNotification(ScrollNotification notification) {
    _changePosition(notification);
    return false;
  }

  void _changePosition(ScrollNotification notification) {
    setState(() {
      _isDragging = true;
    });
  }

  @override
  Widget build(BuildContext ctx) {
    return NotificationListener<ScrollNotification>(
      onNotification: _onScrollNotification,
      child: Stack(
        children: [
          RepaintBoundary(child: widget.child),
          if (_isDragging)
            Positioned.directional(
              textDirection: Directionality.of(ctx),
              top: 0,
              end: -1,
              bottom: 0,
              child: IgnorePointer(
                child: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.centerRight,
                      end: Alignment.centerLeft,
                      colors: [
                        context.colorScheme.inverseSurface.withAlpha(120),
                        context.colorScheme.surface.withAlpha(0),
                      ],
                    ),
                  ),
                  width: context.width * 0.45,
                ),
              ),
            ),
          if (_isDragging)
            for (final segment in _segments)
              Positioned.directional(
                textDirection: Directionality.of(ctx),
                top: widget.topPadding + segment.startOffset,
                end: 5,
                child: _ScrubberSegmentWidget(segment),
              ),
        ],
      ),
    );
  }
}

class _ScrubberSegmentWidget extends StatelessWidget {
  final _ScrubberSegment segment;

  const _ScrubberSegmentWidget(this.segment);

  @override
  Widget build(BuildContext context) {
    const size = Size(10, 10);

    final dot = segment.hasDot
        ? const CustomPaint(
            painter: _Dot(color: Colors.white, radius: 4.0),
            size: size,
          )
        : SizedBox.fromSize(size: size);

    final label = segment.hasLabel
        ? Text(
            segment.date.year.toString(),
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
  final Color color;
  final double radius;

  const _Dot({required this.color, required this.radius});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 5
      ..style = PaintingStyle.fill;
    final center = Offset(size.width / 2, size.height / 2);
    canvas.drawCircle(center, radius, paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class _ScrubberSegment {
  final DateTime date;
  final double startOffset;
  final bool hasDot;
  final bool hasLabel;
  final String scrollLabel;

  const _ScrubberSegment({
    required this.date,
    required this.startOffset,
    required this.hasDot,
    required this.hasLabel,
    required this.scrollLabel,
  });

  _ScrubberSegment copyWith({
    DateTime? date,
    double? startOffset,
    bool? hasDot,
    bool? hasLabel,
    String? hoverLabel,
  }) {
    return _ScrubberSegment(
      date: date ?? this.date,
      startOffset: startOffset ?? this.startOffset,
      hasDot: hasDot ?? this.hasDot,
      hasLabel: hasLabel ?? this.hasLabel,
      scrollLabel: hoverLabel ?? this.scrollLabel,
    );
  }
}
