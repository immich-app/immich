import 'package:flutter/material.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/translate_extensions.dart';

class RatingBar extends StatefulWidget {
  final double initialRating;
  final int itemCount;
  final double itemSize;
  final Color filledColor;
  final Color unfilledColor;
  final ValueChanged<int>? onRatingUpdate;
  final VoidCallback? onClearRating;
  final Widget? itemBuilder;
  final double starPadding;

  const RatingBar({
    super.key,
    this.initialRating = 0.0,
    this.itemCount = 5,
    this.itemSize = 40.0,
    this.filledColor = Colors.amber,
    this.unfilledColor = Colors.grey,
    this.onRatingUpdate,
    this.onClearRating,
    this.itemBuilder,
    this.starPadding = 4.0,
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
    final totalWidth = widget.itemCount * widget.itemSize + (widget.itemCount - 1) * widget.starPadding;
    double dx = localPosition.dx;

    if (isRTL) dx = totalWidth - dx;

    double newRating;

    if (dx <= 0) {
      newRating = 0;
    } else if (dx >= totalWidth) {
      newRating = widget.itemCount.toDouble();
    } else {
      double starWithPadding = widget.itemSize + widget.starPadding;
      int tappedIndex = (dx / starWithPadding).floor().clamp(0, widget.itemCount - 1);
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
    final double visualAlignmentOffset = 5.0;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Transform.translate(
          offset: Offset(isRTL ? visualAlignmentOffset : -visualAlignmentOffset, 0),
          child: GestureDetector(
            behavior: HitTestBehavior.opaque,
            onTapDown: (details) => _updateRating(details.localPosition, isRTL, isTap: true),
            onPanUpdate: (details) => _updateRating(details.localPosition, isRTL, isTap: false),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              textDirection: isRTL ? TextDirection.rtl : TextDirection.ltr,
              children: List.generate(widget.itemCount * 2 - 1, (i) {
                if (i.isOdd) {
                  return SizedBox(width: widget.starPadding);
                }
                int index = i ~/ 2;
                bool filled = _currentRating > index;
                return widget.itemBuilder ??
                    Icon(
                      Icons.star_rounded,
                      size: widget.itemSize,
                      color: filled ? widget.filledColor : widget.unfilledColor,
                    );
              }),
            ),
          ),
        ),
        if (_currentRating > 0)
          Padding(
            padding: const EdgeInsets.only(top: 12.0),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _currentRating = 0;
                });
                widget.onClearRating?.call();
              },
              child: Text(
                'rating_clear'.t(context: context),
                style: TextStyle(color: context.themeData.colorScheme.primary),
              ),
            ),
          ),
      ],
    );
  }
}
