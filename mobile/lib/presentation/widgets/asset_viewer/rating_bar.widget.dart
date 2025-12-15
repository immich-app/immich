import 'package:flutter/material.dart';

class RatingBar extends StatefulWidget {
  final double initialRating;
  final int itemCount;
  final double itemSize;
  final Color filledColor;
  final Color unfilledColor;
  final ValueChanged<int>? onRatingUpdate;
  final Widget? itemBuilder;

  const RatingBar({
    super.key,
    this.initialRating = 0.0,
    this.itemCount = 5,
    this.itemSize = 40.0,
    this.filledColor = Colors.amber,
    this.unfilledColor = Colors.grey,
    this.onRatingUpdate,
    this.itemBuilder,
  });

  @override
  State<RatingBar> createState() => _RatingBarState();
}

class _RatingBarState extends State<RatingBar> {
  late double _currentRating;

  @override
  void initState() {
    super.initState();
    _currentRating = widget.initialRating;
  }

  void _updateRating(Offset localPosition, bool isRTL, {bool isTap = false}) {
    final totalWidth = widget.itemCount * widget.itemSize;
    double dx = localPosition.dx;

    if (isRTL) dx = totalWidth - dx;

    double newRating;

    if (dx <= 0) {
      newRating = 0;
    } else if (dx >= totalWidth) {
      newRating = widget.itemCount.toDouble();
    } else {
      int tappedIndex = (dx ~/ widget.itemSize).clamp(0, widget.itemCount - 1);
      newRating = tappedIndex + 1.0;

      if (isTap && newRating == _currentRating && _currentRating != 0) {
        newRating = 0;
      }
    }

    if (_currentRating != newRating) {
      setState(() {
        _currentRating = newRating;
      });
      widget.onRatingUpdate?.call(newRating.round());
    }
  }

  @override
  Widget build(BuildContext context) {
    final isRTL = Directionality.of(context) == TextDirection.rtl;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTapDown: (details) => _updateRating(details.localPosition, isRTL, isTap: true),
      onPanUpdate: (details) => _updateRating(details.localPosition, isRTL, isTap: false),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
        children: List.generate(widget.itemCount, (index) {
          bool filled = _currentRating > index;
          return widget.itemBuilder ??
              Icon(Icons.star, size: widget.itemSize, color: filled ? widget.filledColor : widget.unfilledColor);
        }),
      ),
    );
  }
}
