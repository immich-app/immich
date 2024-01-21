import 'package:flutter/widgets.dart';

import '../photo_view.dart';
import 'core/photo_view_core.dart';
import 'photo_view_default_widgets.dart';
import 'utils/photo_view_utils.dart';

class ImageWrapper extends StatefulWidget {
  const ImageWrapper({
    super.key,
    required this.imageProvider,
    required this.loadingBuilder,
    required this.backgroundDecoration,
    required this.gaplessPlayback,
    required this.heroAttributes,
    required this.scaleStateChangedCallback,
    required this.enableRotation,
    required this.controller,
    required this.scaleStateController,
    required this.maxScale,
    required this.minScale,
    required this.initialScale,
    required this.basePosition,
    required this.scaleStateCycle,
    required this.onTapUp,
    required this.onTapDown,
    required this.onDragStart,
    required this.onDragEnd,
    required this.onDragUpdate,
    required this.onScaleEnd,
    required this.onLongPressStart,
    required this.outerSize,
    required this.gestureDetectorBehavior,
    required this.tightMode,
    required this.filterQuality,
    required this.disableGestures,
    required this.errorBuilder,
    required this.enablePanAlways,
    required this.index,
  });

  final ImageProvider imageProvider;
  final LoadingBuilder? loadingBuilder;
  final ImageErrorWidgetBuilder? errorBuilder;
  final BoxDecoration backgroundDecoration;
  final bool gaplessPlayback;
  final PhotoViewHeroAttributes? heroAttributes;
  final ValueChanged<PhotoViewScaleState>? scaleStateChangedCallback;
  final bool enableRotation;
  final dynamic maxScale;
  final dynamic minScale;
  final dynamic initialScale;
  final PhotoViewControllerBase controller;
  final PhotoViewScaleStateController scaleStateController;
  final Alignment? basePosition;
  final ScaleStateCycle? scaleStateCycle;
  final PhotoViewImageTapUpCallback? onTapUp;
  final PhotoViewImageTapDownCallback? onTapDown;
  final PhotoViewImageDragStartCallback? onDragStart;
  final PhotoViewImageDragEndCallback? onDragEnd;
  final PhotoViewImageDragUpdateCallback? onDragUpdate;
  final PhotoViewImageScaleEndCallback? onScaleEnd;
  final PhotoViewImageLongPressStartCallback? onLongPressStart;
  final Size outerSize;
  final HitTestBehavior? gestureDetectorBehavior;
  final bool? tightMode;
  final FilterQuality? filterQuality;
  final bool? disableGestures;
  final bool? enablePanAlways;
  final int index;

  @override
  createState() => _ImageWrapperState();
}

class _ImageWrapperState extends State<ImageWrapper> {
  ImageStreamListener? _imageStreamListener;
  ImageStream? _imageStream;
  ImageChunkEvent? _loadingProgress;
  ImageInfo? _imageInfo;
  bool _loading = true;
  Size? _imageSize;
  Object? _lastException;
  StackTrace? _lastStack;

  @override
  void dispose() {
    super.dispose();
    _stopImageStream();
  }

  @override
  void didChangeDependencies() {
    _resolveImage();
    super.didChangeDependencies();
  }

  @override
  void didUpdateWidget(ImageWrapper oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.imageProvider != oldWidget.imageProvider) {
      _resolveImage();
    }
  }

  // retrieve image from the provider
  void _resolveImage() {
    final ImageStream newStream = widget.imageProvider.resolve(
      const ImageConfiguration(),
    );
    _updateSourceStream(newStream);
  }

  ImageStreamListener _getOrCreateListener() {
    void handleImageChunk(ImageChunkEvent event) {
      setState(() {
        _loadingProgress = event;
        _lastException = null;
      });
    }

    void handleImageFrame(ImageInfo info, bool synchronousCall) {
      setupCB() {
        _imageSize = Size(
          info.image.width.toDouble(),
          info.image.height.toDouble(),
        );
        _loading = false;
        _imageInfo = _imageInfo;

        _loadingProgress = null;
        _lastException = null;
        _lastStack = null;
      }

      synchronousCall ? setupCB() : setState(setupCB);
    }

    void handleError(dynamic error, StackTrace? stackTrace) {
      setState(() {
        _loading = false;
        _lastException = error;
        _lastStack = stackTrace;
      });
      assert(() {
        if (widget.errorBuilder == null) {
          throw error;
        }
        return true;
      }());
    }

    _imageStreamListener = ImageStreamListener(
      handleImageFrame,
      onChunk: handleImageChunk,
      onError: handleError,
    );

    return _imageStreamListener!;
  }

  void _updateSourceStream(ImageStream newStream) {
    if (_imageStream?.key == newStream.key) {
      return;
    }
    _imageStream?.removeListener(_imageStreamListener!);
    _imageStream = newStream;
    _imageStream!.addListener(_getOrCreateListener());
  }

  void _stopImageStream() {
    _imageStream?.removeListener(_imageStreamListener!);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) {
      return _buildLoading(context);
    }

    if (_lastException != null) {
      return _buildError(context);
    }

    final scaleBoundaries = ScaleBoundaries(
      widget.minScale ?? 0.0,
      widget.maxScale ?? double.infinity,
      widget.initialScale ?? PhotoViewComputedScale.contained,
      widget.outerSize,
      _imageSize!,
    );

    return PhotoViewCore(
      imageProvider: widget.imageProvider,
      backgroundDecoration: widget.backgroundDecoration,
      gaplessPlayback: widget.gaplessPlayback,
      enableRotation: widget.enableRotation,
      heroAttributes: widget.heroAttributes,
      basePosition: widget.basePosition ?? Alignment.center,
      controller: widget.controller,
      scaleStateController: widget.scaleStateController,
      scaleStateCycle: widget.scaleStateCycle ?? defaultScaleStateCycle,
      scaleBoundaries: scaleBoundaries,
      onTapUp: widget.onTapUp,
      onTapDown: widget.onTapDown,
      onDragStart: widget.onDragStart,
      onDragEnd: widget.onDragEnd,
      onDragUpdate: widget.onDragUpdate,
      onScaleEnd: widget.onScaleEnd,
      onLongPressStart: widget.onLongPressStart,
      gestureDetectorBehavior: widget.gestureDetectorBehavior,
      tightMode: widget.tightMode ?? false,
      filterQuality: widget.filterQuality ?? FilterQuality.none,
      disableGestures: widget.disableGestures ?? false,
      enablePanAlways: widget.enablePanAlways ?? false,
    );
  }

  Widget _buildLoading(BuildContext context) {
    if (widget.loadingBuilder != null) {
      return widget.loadingBuilder!(context, _loadingProgress, widget.index);
    }

    return PhotoViewDefaultLoading(
      event: _loadingProgress,
    );
  }

  Widget _buildError(
    BuildContext context,
  ) {
    if (widget.errorBuilder != null) {
      return widget.errorBuilder!(context, _lastException!, _lastStack);
    }
    return PhotoViewDefaultError(
      decoration: widget.backgroundDecoration,
    );
  }
}

class CustomChildWrapper extends StatelessWidget {
  const CustomChildWrapper({
    super.key,
    this.child,
    required this.childSize,
    required this.backgroundDecoration,
    this.heroAttributes,
    this.scaleStateChangedCallback,
    required this.enableRotation,
    required this.controller,
    required this.scaleStateController,
    required this.maxScale,
    required this.minScale,
    required this.initialScale,
    required this.basePosition,
    required this.scaleStateCycle,
    this.onTapUp,
    this.onTapDown,
    this.onDragStart,
    this.onDragEnd,
    this.onDragUpdate,
    this.onScaleEnd,
    this.onLongPressStart,
    required this.outerSize,
    this.gestureDetectorBehavior,
    required this.tightMode,
    required this.filterQuality,
    required this.disableGestures,
    required this.enablePanAlways,
  });

  final Widget? child;
  final Size? childSize;
  final Decoration backgroundDecoration;
  final PhotoViewHeroAttributes? heroAttributes;
  final ValueChanged<PhotoViewScaleState>? scaleStateChangedCallback;
  final bool enableRotation;

  final PhotoViewControllerBase controller;
  final PhotoViewScaleStateController scaleStateController;

  final dynamic maxScale;
  final dynamic minScale;
  final dynamic initialScale;

  final Alignment? basePosition;
  final ScaleStateCycle? scaleStateCycle;
  final PhotoViewImageTapUpCallback? onTapUp;
  final PhotoViewImageTapDownCallback? onTapDown;
  final PhotoViewImageDragStartCallback? onDragStart;
  final PhotoViewImageDragEndCallback? onDragEnd;
  final PhotoViewImageDragUpdateCallback? onDragUpdate;
  final PhotoViewImageScaleEndCallback? onScaleEnd;
  final PhotoViewImageLongPressStartCallback? onLongPressStart;
  final Size outerSize;
  final HitTestBehavior? gestureDetectorBehavior;
  final bool? tightMode;
  final FilterQuality? filterQuality;
  final bool? disableGestures;
  final bool? enablePanAlways;

  @override
  Widget build(BuildContext context) {
    final scaleBoundaries = ScaleBoundaries(
      minScale ?? 0.0,
      maxScale ?? double.infinity,
      initialScale ?? PhotoViewComputedScale.contained,
      outerSize,
      childSize ?? outerSize,
    );

    return PhotoViewCore.customChild(
      customChild: child,
      backgroundDecoration: backgroundDecoration,
      enableRotation: enableRotation,
      heroAttributes: heroAttributes,
      controller: controller,
      scaleStateController: scaleStateController,
      scaleStateCycle: scaleStateCycle ?? defaultScaleStateCycle,
      basePosition: basePosition ?? Alignment.center,
      scaleBoundaries: scaleBoundaries,
      onTapUp: onTapUp,
      onTapDown: onTapDown,
      onDragStart: onDragStart,
      onDragEnd: onDragEnd,
      onDragUpdate: onDragUpdate,
      onScaleEnd: onScaleEnd,
      onLongPressStart: onLongPressStart,
      gestureDetectorBehavior: gestureDetectorBehavior,
      tightMode: tightMode ?? false,
      filterQuality: filterQuality ?? FilterQuality.none,
      disableGestures: disableGestures ?? false,
      enablePanAlways: enablePanAlways ?? false,
    );
  }
}
