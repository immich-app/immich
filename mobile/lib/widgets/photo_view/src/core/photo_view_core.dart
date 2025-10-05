import 'package:flutter/widgets.dart';
import 'package:immich_mobile/widgets/photo_view/photo_view.dart'
    show
        PhotoViewScaleState,
        PhotoViewHeroAttributes,
        PhotoViewImageTapDownCallback,
        PhotoViewImageTapUpCallback,
        PhotoViewImageScaleEndCallback,
        PhotoViewImageDragEndCallback,
        PhotoViewImageDragStartCallback,
        PhotoViewImageDragUpdateCallback,
        PhotoViewImageLongPressStartCallback,
        ScaleStateCycle;
import 'package:immich_mobile/widgets/photo_view/src/controller/photo_view_controller.dart';
import 'package:immich_mobile/widgets/photo_view/src/controller/photo_view_controller_delegate.dart';
import 'package:immich_mobile/widgets/photo_view/src/controller/photo_view_scalestate_controller.dart';
import 'package:immich_mobile/widgets/photo_view/src/core/photo_view_gesture_detector.dart';
import 'package:immich_mobile/widgets/photo_view/src/core/photo_view_hit_corners.dart';
import 'package:immich_mobile/widgets/photo_view/src/utils/photo_view_utils.dart';

const _defaultDecoration = BoxDecoration(color: Color.fromRGBO(0, 0, 0, 1.0));

/// Internal widget in which controls all animations lifecycle, core responses
/// to user gestures, updates to  the controller state and mounts the entire PhotoView Layout
class PhotoViewCore extends StatefulWidget {
  const PhotoViewCore({
    super.key,
    required this.imageProvider,
    required this.backgroundDecoration,
    required this.semanticLabel,
    required this.gaplessPlayback,
    required this.heroAttributes,
    required this.enableRotation,
    required this.onTapUp,
    required this.onTapDown,
    required this.onDragStart,
    required this.onDragEnd,
    required this.onDragUpdate,
    required this.onScaleEnd,
    required this.onLongPressStart,
    required this.gestureDetectorBehavior,
    required this.controller,
    required this.scaleBoundaries,
    required this.scaleStateCycle,
    required this.scaleStateController,
    required this.basePosition,
    required this.tightMode,
    required this.filterQuality,
    required this.disableGestures,
    required this.disableScaleGestures,
    required this.enablePanAlways,
  }) : customChild = null;

  const PhotoViewCore.customChild({
    super.key,
    required this.customChild,
    required this.backgroundDecoration,
    this.heroAttributes,
    required this.enableRotation,
    this.onTapUp,
    this.onTapDown,
    this.onDragStart,
    this.onDragEnd,
    this.onDragUpdate,
    this.onScaleEnd,
    this.onLongPressStart,
    this.gestureDetectorBehavior,
    required this.controller,
    required this.scaleBoundaries,
    required this.scaleStateCycle,
    required this.scaleStateController,
    required this.basePosition,
    required this.tightMode,
    required this.filterQuality,
    required this.disableGestures,
    required this.disableScaleGestures,
    required this.enablePanAlways,
  }) : semanticLabel = null,
       imageProvider = null,
       gaplessPlayback = false;

  final Decoration? backgroundDecoration;
  final ImageProvider? imageProvider;
  final String? semanticLabel;
  final bool? gaplessPlayback;
  final PhotoViewHeroAttributes? heroAttributes;
  final bool enableRotation;
  final Widget? customChild;

  final PhotoViewControllerBase controller;
  final PhotoViewScaleStateController scaleStateController;
  final ScaleBoundaries scaleBoundaries;
  final ScaleStateCycle scaleStateCycle;
  final Alignment basePosition;

  final PhotoViewImageTapUpCallback? onTapUp;
  final PhotoViewImageTapDownCallback? onTapDown;
  final PhotoViewImageScaleEndCallback? onScaleEnd;

  final PhotoViewImageDragStartCallback? onDragStart;
  final PhotoViewImageDragEndCallback? onDragEnd;
  final PhotoViewImageDragUpdateCallback? onDragUpdate;

  final PhotoViewImageLongPressStartCallback? onLongPressStart;

  final HitTestBehavior? gestureDetectorBehavior;
  final bool tightMode;
  final bool disableGestures;
  final bool disableScaleGestures;
  final bool enablePanAlways;

  final FilterQuality filterQuality;

  @override
  State<StatefulWidget> createState() {
    return PhotoViewCoreState();
  }

  bool get hasCustomChild => customChild != null;
}

class PhotoViewCoreState extends State<PhotoViewCore>
    with TickerProviderStateMixin, PhotoViewControllerDelegate, HitCornersDetector {
  double? _scaleBefore;
  double? _rotationBefore;

  late final AnimationController _scaleAnimationController;
  Animation<double>? _scaleAnimation;

  late final AnimationController _positionAnimationController;
  Animation<Offset>? _positionAnimation;

  late final AnimationController _rotationAnimationController = AnimationController(vsync: this)
    ..addListener(handleRotationAnimation);
  Animation<double>? _rotationAnimation;

  PhotoViewHeroAttributes? get heroAttributes => widget.heroAttributes;

  late ScaleBoundaries cachedScaleBoundaries = widget.scaleBoundaries;

  void handleScaleAnimation() {
    scale = _scaleAnimation!.value;
  }

  void handlePositionAnimate() {
    controller.position = _positionAnimation!.value;
  }

  void handleRotationAnimation() {
    controller.rotation = _rotationAnimation!.value;
  }

  void onScaleStart(ScaleStartDetails details) {
    _rotationBefore = controller.rotation;
    _scaleBefore = scale;
    _scaleAnimationController.stop();
    _positionAnimationController.stop();
    _rotationAnimationController.stop();
  }

  bool _shouldAllowPanRotate() => switch (scaleStateController.scaleState) {
    PhotoViewScaleState.zoomedIn => scaleStateController.hasZoomedOutManually,
    _ => true,
  };

  void onScaleUpdate(ScaleUpdateDetails details) {
    final centeredFocalPoint = Offset(
      details.focalPoint.dx - scaleBoundaries.outerSize.width / 2,
      details.focalPoint.dy - scaleBoundaries.outerSize.height / 2,
    );
    final double newScale = _scaleBefore! * details.scale;
    final double scaleDelta = newScale / scale;
    final Offset newPosition =
        (controller.position + details.focalPointDelta) * scaleDelta - centeredFocalPoint * (scaleDelta - 1);

    updateScaleStateFromNewScale(newScale);

    final panEnabled = widget.enablePanAlways && _shouldAllowPanRotate();
    final rotationEnabled = widget.enableRotation && _shouldAllowPanRotate();

    updateMultiple(
      scale: newScale,
      position: panEnabled ? newPosition : clampPosition(position: newPosition),
      rotation: rotationEnabled ? _rotationBefore! + details.rotation : null,
      rotationFocusPoint: rotationEnabled ? details.focalPoint : null,
    );
  }

  void onScaleEnd(ScaleEndDetails details) {
    final double s = scale;
    final Offset p = controller.position;
    final double maxScale = scaleBoundaries.maxScale;
    final double minScale = scaleBoundaries.minScale;

    widget.onScaleEnd?.call(context, details, controller.value);

    final scaleState = getScaleStateFromNewScale(scale);
    if (scaleState == PhotoViewScaleState.zoomedOut) {
      scaleStateController.scaleState = PhotoViewScaleState.initial;
    } else if (scaleState == PhotoViewScaleState.zoomedIn) {
      animateRotation(controller.rotation, 0);
      if (_shouldAllowPanRotate()) {
        animatePosition(controller.position, Offset.zero);
      }
    }

    //animate back to maxScale if gesture exceeded the maxScale specified
    if (s > maxScale) {
      final double scaleComebackRatio = maxScale / s;
      animateScale(s, maxScale);
      final Offset clampedPosition = clampPosition(position: p * scaleComebackRatio, scale: maxScale);
      animatePosition(p, clampedPosition);
      return;
    }

    //animate back to minScale if gesture fell smaller than the minScale specified
    if (s < minScale) {
      final double scaleComebackRatio = minScale / s;
      animateScale(s, minScale);
      animatePosition(p, clampPosition(position: p * scaleComebackRatio, scale: minScale));
      return;
    }
    // get magnitude from gesture velocity
    final double magnitude = details.velocity.pixelsPerSecond.distance;

    // animate velocity only if there is no scale change and a significant magnitude
    if (_scaleBefore! / s == 1.0 && magnitude >= 400.0) {
      final Offset direction = details.velocity.pixelsPerSecond / magnitude;
      animatePosition(p, clampPosition(position: p + direction * 100.0));
    }
  }

  void onDoubleTap() {
    nextScaleState();
  }

  void animateScale(double from, double to) {
    if (!mounted) {
      return;
    }
    _scaleAnimation = Tween<double>(begin: from, end: to).animate(_scaleAnimationController);
    _scaleAnimationController
      ..value = 0.0
      ..fling(velocity: 0.4);
  }

  void animatePosition(Offset from, Offset to) {
    if (!mounted) {
      return;
    }
    _positionAnimation = Tween<Offset>(begin: from, end: to).animate(_positionAnimationController);
    _positionAnimationController
      ..value = 0.0
      ..fling(velocity: 0.4);
  }

  void animateRotation(double from, double to) {
    if (!mounted) {
      return;
    }
    _rotationAnimation = Tween<double>(begin: from, end: to).animate(_rotationAnimationController);
    _rotationAnimationController
      ..value = 0.0
      ..fling(velocity: 0.4);
  }

  void onAnimationStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      onAnimationStatusCompleted();
    }
  }

  /// Check if scale is equal to initial after scale animation update
  void onAnimationStatusCompleted() {
    if (scaleStateController.scaleState != PhotoViewScaleState.initial && scale == scaleBoundaries.initialScale) {
      scaleStateController.setInvisibly(PhotoViewScaleState.initial);
    }
  }

  void _animateControllerPosition(Offset position) {
    animatePosition(controller.position, position);
  }

  void _animateControllerScale(double scale) {
    if (controller.scale != null) {
      animateScale(controller.scale!, scale);
    }
  }

  void _animateControllerRotation(double rotation) {
    animateRotation(controller.rotation, rotation);
  }

  @override
  void initState() {
    super.initState();
    initDelegate();
    addAnimateOnScaleStateUpdate(animateOnScaleStateUpdate);
    controller.positionAnimationBuilder(_animateControllerPosition);
    controller.scaleAnimationBuilder(_animateControllerScale);
    controller.rotationAnimationBuilder(_animateControllerRotation);

    cachedScaleBoundaries = widget.scaleBoundaries;

    _scaleAnimationController = AnimationController(vsync: this)
      ..addListener(handleScaleAnimation)
      ..addStatusListener(onAnimationStatus);
    _positionAnimationController = AnimationController(vsync: this)..addListener(handlePositionAnimate);
  }

  void animateOnScaleStateUpdate(double prevScale, double nextScale) {
    animateScale(prevScale, nextScale);
    animatePosition(controller.position, Offset.zero);
    animateRotation(controller.rotation, 0.0);
  }

  @override
  void dispose() {
    _scaleAnimationController.removeStatusListener(onAnimationStatus);
    _scaleAnimationController.dispose();
    _positionAnimationController.dispose();
    _rotationAnimationController.dispose();
    super.dispose();
  }

  void onTapUp(TapUpDetails details) {
    widget.onTapUp?.call(context, details, controller.value);
  }

  void onTapDown(TapDownDetails details) {
    widget.onTapDown?.call(context, details, controller.value);
  }

  @override
  Widget build(BuildContext context) {
    // Check if we need a recalc on the scale
    if (widget.scaleBoundaries != cachedScaleBoundaries) {
      markNeedsScaleRecalc = true;
      cachedScaleBoundaries = widget.scaleBoundaries;
    }

    return StreamBuilder(
      stream: controller.outputStateStream,
      initialData: controller.prevValue,
      builder: (BuildContext context, AsyncSnapshot<PhotoViewControllerValue> snapshot) {
        if (snapshot.hasData) {
          final PhotoViewControllerValue value = snapshot.data!;
          final useImageScale = widget.filterQuality != FilterQuality.none;

          final computedScale = useImageScale ? 1.0 : scale;

          final matrix = Matrix4.identity()
            ..translateByDouble(value.position.dx, value.position.dy, 0, 1.0)
            ..scaleByDouble(computedScale, computedScale, computedScale, 1.0)
            ..rotateZ(value.rotation);

          final Widget customChildLayout = CustomSingleChildLayout(
            delegate: _CenterWithOriginalSizeDelegate(scaleBoundaries.childSize, basePosition, useImageScale),
            child: _buildHero(_buildChild()),
          );

          final child = Container(
            constraints: widget.tightMode ? BoxConstraints.tight(scaleBoundaries.childSize * scale) : null,
            decoration: widget.backgroundDecoration ?? _defaultDecoration,
            child: Center(
              child: Transform(transform: matrix, alignment: basePosition, child: customChildLayout),
            ),
          );

          if (widget.disableGestures) {
            return child;
          }

          return PhotoViewGestureDetector(
            disableScaleGestures: widget.disableScaleGestures,
            onDoubleTap: widget.disableScaleGestures ? null : onDoubleTap,
            onScaleStart: widget.disableScaleGestures ? null : onScaleStart,
            onScaleUpdate: widget.disableScaleGestures ? null : onScaleUpdate,
            onScaleEnd: widget.disableScaleGestures ? null : onScaleEnd,
            onDragStart: widget.onDragStart != null
                ? (details) => widget.onDragStart!(context, details, widget.controller, widget.scaleStateController)
                : null,
            onDragEnd: widget.onDragEnd != null
                ? (details) => widget.onDragEnd!(context, details, widget.controller.value)
                : null,
            onDragUpdate: widget.onDragUpdate != null
                ? (details) => widget.onDragUpdate!(context, details, widget.controller.value)
                : null,
            hitDetector: this,
            onTapUp: widget.onTapUp != null ? (details) => widget.onTapUp!(context, details, value) : null,
            onTapDown: widget.onTapDown != null ? (details) => widget.onTapDown!(context, details, value) : null,
            onLongPressStart: widget.onLongPressStart != null
                ? (details) => widget.onLongPressStart!(context, details, value)
                : null,
            child: child,
          );
        } else {
          return Container();
        }
      },
    );
  }

  Widget _buildHero(Widget child) {
    return heroAttributes != null
        ? Hero(
            tag: heroAttributes!.tag,
            createRectTween: heroAttributes!.createRectTween,
            flightShuttleBuilder: heroAttributes!.flightShuttleBuilder,
            placeholderBuilder: heroAttributes!.placeholderBuilder,
            transitionOnUserGestures: heroAttributes!.transitionOnUserGestures,
            child: child,
          )
        : child;
  }

  Widget _buildChild() {
    return widget.hasCustomChild
        ? widget.customChild!
        : Image(
            key: widget.heroAttributes?.tag != null ? ObjectKey(widget.heroAttributes!.tag) : null,
            image: widget.imageProvider!,
            semanticLabel: widget.semanticLabel,
            gaplessPlayback: widget.gaplessPlayback ?? false,
            filterQuality: widget.filterQuality,
            width: scaleBoundaries.childSize.width * scale,
            fit: BoxFit.cover,
            isAntiAlias: widget.filterQuality == FilterQuality.high,
          );
  }
}

class _CenterWithOriginalSizeDelegate extends SingleChildLayoutDelegate {
  const _CenterWithOriginalSizeDelegate(this.subjectSize, this.basePosition, this.useImageScale);

  final Size subjectSize;
  final Alignment basePosition;
  final bool useImageScale;

  @override
  Offset getPositionForChild(Size size, Size childSize) {
    final childWidth = useImageScale ? childSize.width : subjectSize.width;
    final childHeight = useImageScale ? childSize.height : subjectSize.height;

    final halfWidth = (size.width - childWidth) / 2;
    final halfHeight = (size.height - childHeight) / 2;

    final double offsetX = halfWidth * (basePosition.x + 1);
    final double offsetY = halfHeight * (basePosition.y + 1);

    return Offset(offsetX, offsetY);
  }

  @override
  BoxConstraints getConstraintsForChild(BoxConstraints constraints) {
    return useImageScale ? const BoxConstraints() : BoxConstraints.tight(subjectSize);
  }

  @override
  bool shouldRelayout(_CenterWithOriginalSizeDelegate oldDelegate) {
    return oldDelegate != this;
  }

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is _CenterWithOriginalSizeDelegate &&
          runtimeType == other.runtimeType &&
          subjectSize == other.subjectSize &&
          basePosition == other.basePosition &&
          useImageScale == other.useImageScale;

  @override
  int get hashCode => subjectSize.hashCode ^ basePosition.hashCode ^ useImageScale.hashCode;
}
