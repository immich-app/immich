import 'dart:async';

import 'package:flutter/material.dart';
import 'package:scrollable_positioned_list/scrollable_positioned_list.dart';

/// Build the Scroll Thumb and label using the current configuration
typedef ScrollThumbBuilder = Widget Function(
  Color backgroundColor,
  Animation<double> thumbAnimation,
  Animation<double> labelAnimation,
  double height, {
  Text? labelText,
  BoxConstraints? labelConstraints,
});

/// Build a Text widget using the current scroll offset
typedef LabelTextBuilder = Text Function(int item);

/// A widget that will display a BoxScrollView with a ScrollThumb that can be dragged
/// for quick navigation of the BoxScrollView.
class DraggableScrollbar extends StatefulWidget {
  /// The view that will be scrolled with the scroll thumb
  final ScrollablePositionedList child;

  final ItemPositionsListener itemPositionsListener;

  /// A function that builds a thumb using the current configuration
  final ScrollThumbBuilder scrollThumbBuilder;

  /// The height of the scroll thumb
  final double heightScrollThumb;

  /// The background color of the label and thumb
  final Color backgroundColor;

  /// The amount of padding that should surround the thumb
  final EdgeInsetsGeometry? padding;

  /// The height offset of the thumb/bar from the bottom of the page
  final double? heightOffset;

  /// Determines how quickly the scrollbar will animate in and out
  final Duration scrollbarAnimationDuration;

  /// How long should the thumb be visible before fading out
  final Duration scrollbarTimeToFade;

  /// Build a Text widget from the current offset in the BoxScrollView
  final LabelTextBuilder? labelTextBuilder;

  /// Determines box constraints for Container displaying label
  final BoxConstraints? labelConstraints;

  /// The ScrollController for the BoxScrollView
  final ItemScrollController controller;

  /// Determines scrollThumb displaying. If you draw own ScrollThumb and it is true you just don't need to use animation parameters in [scrollThumbBuilder]
  final bool alwaysVisibleScrollThumb;

  final Function(bool scrolling) scrollStateListener;

  DraggableScrollbar.semicircle({
    super.key,
    Key? scrollThumbKey,
    this.alwaysVisibleScrollThumb = false,
    required this.child,
    required this.controller,
    required this.itemPositionsListener,
    required this.scrollStateListener,
    this.heightScrollThumb = 48.0,
    this.backgroundColor = Colors.white,
    this.padding,
    this.heightOffset,
    this.scrollbarAnimationDuration = const Duration(milliseconds: 300),
    this.scrollbarTimeToFade = const Duration(milliseconds: 600),
    this.labelTextBuilder,
    this.labelConstraints,
  })  : assert(child.scrollDirection == Axis.vertical),
        scrollThumbBuilder = _thumbSemicircleBuilder(
          heightScrollThumb * 0.6,
          scrollThumbKey,
          alwaysVisibleScrollThumb,
        );

  @override
  DraggableScrollbarState createState() => DraggableScrollbarState();

  static buildScrollThumbAndLabel({
    required Widget scrollThumb,
    required Color backgroundColor,
    required Animation<double>? thumbAnimation,
    required Animation<double>? labelAnimation,
    required Text? labelText,
    required BoxConstraints? labelConstraints,
    required bool alwaysVisibleScrollThumb,
  }) {
    var scrollThumbAndLabel = labelText == null
        ? scrollThumb
        : Row(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              ScrollLabel(
                animation: labelAnimation,
                backgroundColor: backgroundColor,
                constraints: labelConstraints,
                child: labelText,
              ),
              scrollThumb,
            ],
          );

    if (alwaysVisibleScrollThumb) {
      return scrollThumbAndLabel;
    }
    return SlideFadeTransition(
      animation: thumbAnimation!,
      child: scrollThumbAndLabel,
    );
  }

  static ScrollThumbBuilder _thumbSemicircleBuilder(
    double width,
    Key? scrollThumbKey,
    bool alwaysVisibleScrollThumb,
  ) {
    return (
      Color backgroundColor,
      Animation<double> thumbAnimation,
      Animation<double> labelAnimation,
      double height, {
      Text? labelText,
      BoxConstraints? labelConstraints,
    }) {
      final scrollThumb = CustomPaint(
        key: scrollThumbKey,
        foregroundPainter: ArrowCustomPainter(Colors.white),
        child: Material(
          elevation: 4.0,
          color: backgroundColor,
          borderRadius: BorderRadius.only(
            topLeft: Radius.circular(height),
            bottomLeft: Radius.circular(height),
            topRight: const Radius.circular(4.0),
            bottomRight: const Radius.circular(4.0),
          ),
          child: Container(
            constraints: BoxConstraints.tight(Size(width, height)),
          ),
        ),
      );

      return buildScrollThumbAndLabel(
        scrollThumb: scrollThumb,
        backgroundColor: backgroundColor,
        thumbAnimation: thumbAnimation,
        labelAnimation: labelAnimation,
        labelText: labelText,
        labelConstraints: labelConstraints,
        alwaysVisibleScrollThumb: alwaysVisibleScrollThumb,
      );
    };
  }
}

class ScrollLabel extends StatelessWidget {
  final Animation<double>? animation;
  final Color backgroundColor;
  final Text child;

  final BoxConstraints? constraints;
  static const BoxConstraints _defaultConstraints =
      BoxConstraints.tightFor(width: 72.0, height: 28.0);

  const ScrollLabel({
    super.key,
    required this.child,
    required this.animation,
    required this.backgroundColor,
    this.constraints = _defaultConstraints,
  });

  @override
  Widget build(BuildContext context) {
    return FadeTransition(
      opacity: animation!,
      child: Container(
        margin: const EdgeInsets.only(right: 12.0),
        child: Material(
          elevation: 4.0,
          color: backgroundColor,
          borderRadius: const BorderRadius.all(Radius.circular(16.0)),
          child: Container(
            constraints: constraints ?? _defaultConstraints,
            padding: const EdgeInsets.symmetric(horizontal: 10.0),
            alignment: Alignment.center,
            child: child,
          ),
        ),
      ),
    );
  }
}

class DraggableScrollbarState extends State<DraggableScrollbar>
    with TickerProviderStateMixin {
  late double _barOffset;
  late bool _isDragInProcess;
  late int _currentItem;

  late AnimationController _thumbAnimationController;
  late Animation<double> _thumbAnimation;
  late AnimationController _labelAnimationController;
  late Animation<double> _labelAnimation;
  Timer? _fadeoutTimer;

  @override
  void initState() {
    super.initState();
    _barOffset = 0.0;
    _isDragInProcess = false;
    _currentItem = 0;

    _thumbAnimationController = AnimationController(
      vsync: this,
      duration: widget.scrollbarAnimationDuration,
    );

    _thumbAnimation = CurvedAnimation(
      parent: _thumbAnimationController,
      curve: Curves.fastOutSlowIn,
    );

    _labelAnimationController = AnimationController(
      vsync: this,
      duration: widget.scrollbarAnimationDuration,
    );

    _labelAnimation = CurvedAnimation(
      parent: _labelAnimationController,
      curve: Curves.fastOutSlowIn,
    );
  }

  @override
  void dispose() {
    _thumbAnimationController.dispose();
    _labelAnimationController.dispose();
    _fadeoutTimer?.cancel();
    super.dispose();
  }

  double get barMaxScrollExtent =>
      (context.size?.height ?? 0) -
      widget.heightScrollThumb -
      (widget.heightOffset ?? 0);

  double get barMinScrollExtent => 0;

  int get maxItemCount => widget.child.itemCount;

  @override
  Widget build(BuildContext context) {
    Text? labelText;
    if (widget.labelTextBuilder != null && _isDragInProcess) {
      labelText = widget.labelTextBuilder!(_currentItem);
    }

    return LayoutBuilder(
      builder: (BuildContext context, BoxConstraints constraints) {
        //print("LayoutBuilder constraints=$constraints");

        return NotificationListener<ScrollNotification>(
          onNotification: (ScrollNotification notification) {
            changePosition(notification);
            return false;
          },
          child: Stack(
            children: <Widget>[
              RepaintBoundary(
                child: widget.child,
              ),
              RepaintBoundary(
                child: GestureDetector(
                  onVerticalDragStart: _onVerticalDragStart,
                  onVerticalDragUpdate: _onVerticalDragUpdate,
                  onVerticalDragEnd: _onVerticalDragEnd,
                  child: Container(
                    alignment: Alignment.topRight,
                    margin: EdgeInsets.only(top: _barOffset),
                    padding: widget.padding,
                    child: widget.scrollThumbBuilder(
                      widget.backgroundColor,
                      _thumbAnimation,
                      _labelAnimation,
                      widget.heightScrollThumb,
                      labelText: labelText,
                      labelConstraints: widget.labelConstraints,
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  // scroll bar has received notification that it's view was scrolled
  // so it should also changes his position
  // but only if it isn't dragged
  changePosition(ScrollNotification notification) {
    if (_isDragInProcess) {
      return;
    }

    setState(() {
      try {
        int firstItemIndex =
            widget.itemPositionsListener.itemPositions.value.first.index;

        if (notification is ScrollUpdateNotification) {
          _barOffset = (firstItemIndex / maxItemCount) * barMaxScrollExtent;

          if (_barOffset < barMinScrollExtent) {
            _barOffset = barMinScrollExtent;
          }
          if (_barOffset > barMaxScrollExtent) {
            _barOffset = barMaxScrollExtent;
          }
        }

        if (notification is ScrollUpdateNotification ||
            notification is OverscrollNotification) {
          if (_thumbAnimationController.status != AnimationStatus.forward) {
            _thumbAnimationController.forward();
          }

          if (itemPosition < maxItemCount) {
            _currentItem = itemPosition;
          }

          _fadeoutTimer?.cancel();
          _fadeoutTimer = Timer(widget.scrollbarTimeToFade, () {
            _thumbAnimationController.reverse();
            _labelAnimationController.reverse();
            _fadeoutTimer = null;
          });
        }
      } catch (_) {}
    });
  }

  void _onVerticalDragStart(DragStartDetails details) {
    setState(() {
      _isDragInProcess = true;
      _labelAnimationController.forward();
      _fadeoutTimer?.cancel();
    });

    widget.scrollStateListener(true);
  }

  int get itemPosition {
    int numberOfItems = widget.child.itemCount;
    return ((_barOffset / barMaxScrollExtent) * numberOfItems).toInt();
  }

  void _jumpToBarPosition() {
    if (itemPosition > maxItemCount - 1) {
      return;
    }

    _currentItem = itemPosition;

    /// If the bar is at the bottom but the item position is still smaller than the max item count (due to rounding error)
    /// jump to the end of the list
    if (barMaxScrollExtent - _barOffset < 10 && itemPosition < maxItemCount) {
      widget.controller.jumpTo(
        index: maxItemCount,
      );

      return;
    }

    widget.controller.jumpTo(
      index: itemPosition,
    );
  }

  Timer? dragHaltTimer;
  int lastTimerPosition = 0;

  void _onVerticalDragUpdate(DragUpdateDetails details) {
    setState(() {
      if (_thumbAnimationController.status != AnimationStatus.forward) {
        _thumbAnimationController.forward();
      }
      if (_isDragInProcess) {
        _barOffset += details.delta.dy;

        if (_barOffset < barMinScrollExtent) {
          _barOffset = barMinScrollExtent;
        }
        if (_barOffset > barMaxScrollExtent) {
          _barOffset = barMaxScrollExtent;
        }

        if (itemPosition != lastTimerPosition) {
          lastTimerPosition = itemPosition;
          dragHaltTimer?.cancel();
          widget.scrollStateListener(true);

          dragHaltTimer = Timer(
            const Duration(milliseconds: 500),
            () {
              widget.scrollStateListener(false);
            },
          );
        }

        _jumpToBarPosition();
      }
    });
  }

  void _onVerticalDragEnd(DragEndDetails details) {
    _fadeoutTimer = Timer(widget.scrollbarTimeToFade, () {
      _thumbAnimationController.reverse();
      _labelAnimationController.reverse();
      _fadeoutTimer = null;
    });

    setState(() {
      _jumpToBarPosition();
      _isDragInProcess = false;
    });

    widget.scrollStateListener(false);
  }
}

/// Draws 2 triangles like arrow up and arrow down
class ArrowCustomPainter extends CustomPainter {
  Color color;

  ArrowCustomPainter(this.color);

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

///This cut 2 lines in arrow shape
class ArrowClipper extends CustomClipper<Path> {
  @override
  Path getClip(Size size) {
    Path path = Path();
    path.lineTo(0.0, size.height);
    path.lineTo(size.width, size.height);
    path.lineTo(size.width, 0.0);
    path.lineTo(0.0, 0.0);
    path.close();

    double arrowWidth = 8.0;
    double startPointX = (size.width - arrowWidth) / 2;
    double startPointY = size.height / 2 - arrowWidth / 2;
    path.moveTo(startPointX, startPointY);
    path.lineTo(startPointX + arrowWidth / 2, startPointY - arrowWidth / 2);
    path.lineTo(startPointX + arrowWidth, startPointY);
    path.lineTo(startPointX + arrowWidth, startPointY + 1.0);
    path.lineTo(
      startPointX + arrowWidth / 2,
      startPointY - arrowWidth / 2 + 1.0,
    );
    path.lineTo(startPointX, startPointY + 1.0);
    path.close();

    startPointY = size.height / 2 + arrowWidth / 2;
    path.moveTo(startPointX + arrowWidth, startPointY);
    path.lineTo(startPointX + arrowWidth / 2, startPointY + arrowWidth / 2);
    path.lineTo(startPointX, startPointY);
    path.lineTo(startPointX, startPointY - 1.0);
    path.lineTo(
      startPointX + arrowWidth / 2,
      startPointY + arrowWidth / 2 - 1.0,
    );
    path.lineTo(startPointX + arrowWidth, startPointY - 1.0);
    path.close();

    return path;
  }

  @override
  bool shouldReclip(CustomClipper<Path> oldClipper) => false;
}

class SlideFadeTransition extends StatelessWidget {
  final Animation<double> animation;
  final Widget child;

  const SlideFadeTransition({
    super.key,
    required this.animation,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: animation,
      builder: (context, child) =>
          animation.value == 0.0 ? const SizedBox() : child!,
      child: SlideTransition(
        position: Tween(
          begin: const Offset(0.3, 0.0),
          end: const Offset(0.0, 0.0),
        ).animate(animation),
        child: FadeTransition(
          opacity: animation,
          child: child,
        ),
      ),
    );
  }
}
