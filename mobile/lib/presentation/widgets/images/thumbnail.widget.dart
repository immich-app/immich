import 'dart:async';
import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumb_hash_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:logging/logging.dart';

final log = Logger('ThumbnailWidget');

class Thumbnail extends StatefulWidget {
  final ImageProvider? imageProvider;
  final ImageProvider? thumbhashProvider;
  final BoxFit fit;

  const Thumbnail({this.imageProvider, this.fit = BoxFit.cover, this.thumbhashProvider, super.key});

  Thumbnail.remote({
    required String remoteId,
    required String thumbhash,
    this.fit = BoxFit.cover,

    /// Physical size to decode, or null for the source size.
    Size? decodeSize,
    super.key,
  }) : imageProvider = RemoteImageProvider.thumbnail(assetId: remoteId, thumbhash: thumbhash, decodeSize: decodeSize),
       thumbhashProvider = null;

  Thumbnail.fromAsset({
    required BaseAsset? asset,
    this.fit = BoxFit.cover,

    /// Decode size for local thumbnails. This does not affect the widget size.
    Size size = kThumbnailResolution,

    /// Physical size to decode for remote thumbnails.
    Size? remoteSize,
    super.key,
  }) : thumbhashProvider = switch (asset) {
         RemoteAsset() when asset.thumbHash != null && asset.localId == null => ThumbHashProvider(
           thumbHash: asset.thumbHash!,
         ),
         _ => null,
       },
       imageProvider = asset == null ? null : getThumbnailImageProvider(asset, size: size, remoteSize: remoteSize);

  @override
  State<Thumbnail> createState() => _ThumbnailState();
}

class _ThumbnailState extends State<Thumbnail> with SingleTickerProviderStateMixin {
  ui.Image? _providerImage;
  bool _doFadeIn = false;

  ImageStream? _imageStream;
  ImageStreamListener? _imageStreamListener;
  ImageStream? _thumbhashStream;
  ImageStreamListener? _thumbhashStreamListener;

  static final _gradientCache = Map<ColorScheme, Gradient>.identity();

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  void _loadFromThumbhashProvider() {
    _stopListeningToThumbhashStream();
    final thumbhashProvider = widget.thumbhashProvider;
    if (thumbhashProvider == null || _providerImage != null) {
      return;
    }

    final thumbhashStream = _thumbhashStream = thumbhashProvider.resolve(ImageConfiguration.empty);
    final thumbhashStreamListener = _thumbhashStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        _stopListeningToThumbhashStream();
        if (!mounted || _providerImage != null) {
          imageInfo.dispose();
          return;
        }
        setState(() {
          _providerImage = imageInfo.image;
          _doFadeIn = false;
        });
      },
      onError: (exception, stackTrace) {
        log.severe('Error loading thumbhash', exception, stackTrace);
        _stopListeningToThumbhashStream();
      },
    );
    thumbhashStream.addListener(thumbhashStreamListener);
  }

  void _loadFromImageProvider() {
    _stopListeningToImageStream();
    final imageProvider = widget.imageProvider;
    if (imageProvider == null) {
      return;
    }

    final imageStream = _imageStream = imageProvider.resolve(ImageConfiguration.empty);
    final imageStreamListener = _imageStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        _stopListeningToThumbhashStream();
        if (!mounted) {
          imageInfo.dispose();
          return;
        }

        if (_providerImage == imageInfo.image) {
          return;
        }

        final doFadeIn = !(synchronousCall && _providerImage == null) && _isVisible();
        setState(() {
          _providerImage?.dispose();
          _providerImage = imageInfo.image;
          _doFadeIn = doFadeIn;
        });
      },
      onError: (exception, stackTrace) {
        log.severe('Error loading image: $exception', exception, stackTrace);
        _stopListeningToImageStream();
      },
    );
    imageStream.addListener(imageStreamListener);
  }

  void _stopListeningToImageStream() {
    if (_imageStreamListener != null && _imageStream != null) {
      _imageStream!.removeListener(_imageStreamListener!);
    }
    _imageStream = null;
    _imageStreamListener = null;
  }

  void _stopListeningToThumbhashStream() {
    if (_thumbhashStreamListener != null && _thumbhashStream != null) {
      _thumbhashStream!.removeListener(_thumbhashStreamListener!);
    }
    _thumbhashStream = null;
    _thumbhashStreamListener = null;
  }

  void _stopListeningToStream() {
    _stopListeningToImageStream();
    _stopListeningToThumbhashStream();
  }

  @override
  void didUpdateWidget(Thumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.imageProvider != oldWidget.imageProvider) {
      _loadFromImageProvider();
    }

    if (_providerImage == null && oldWidget.thumbhashProvider != widget.thumbhashProvider) {
      _loadFromThumbhashProvider();
    }
  }

  @override
  void reassemble() {
    super.reassemble();
    _loadImage();
  }

  void _loadImage() {
    _loadFromImageProvider();
    _loadFromThumbhashProvider();
  }

  bool _isVisible() {
    final renderObject = context.findRenderObject() as RenderBox?;
    if (renderObject == null || !renderObject.attached) {
      return false;
    }

    final topLeft = renderObject.localToGlobal(Offset.zero);
    final bottomRight = renderObject.localToGlobal(Offset(renderObject.size.width, renderObject.size.height));
    return topLeft.dy < context.height && bottomRight.dy > 0;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = context.colorScheme;
    final gradient = _gradientCache[colorScheme] ??= LinearGradient(
      colors: [colorScheme.surfaceContainer, colorScheme.surfaceContainer.darken(amount: .1)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return _ThumbnailLeaf(
      vsync: this,
      image: _providerImage,
      doFadeIn: _doFadeIn,
      fit: widget.fit,
      placeholderGradient: gradient,
    );
  }

  @override
  void dispose() {
    _stopListeningToStream();
    _providerImage?.dispose();
    super.dispose();
  }
}

class _ThumbnailLeaf extends LeafRenderObjectWidget {
  final TickerProvider vsync;
  final ui.Image? image;
  final bool doFadeIn;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbnailLeaf({
    required this.vsync,
    required this.image,
    required this.doFadeIn,
    required this.fit,
    required this.placeholderGradient,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbnailRenderBox(vsync: vsync, image: image?.clone(), fit: fit, placeholderGradient: placeholderGradient);
  }

  @override
  void updateRenderObject(BuildContext context, _ThumbnailRenderBox renderObject) {
    renderObject
      ..show(image, doFadeIn: doFadeIn)
      ..fit = fit
      ..placeholderGradient = placeholderGradient;
  }
}

class _ThumbnailRenderBox extends RenderBox {
  final TickerProvider _vsync;
  ui.Image? _image;
  ui.Image? _previousImage;
  AnimationController? _fade;
  BoxFit _fit;
  Gradient _placeholderGradient;

  @override
  bool isRepaintBoundary = true;

  _ThumbnailRenderBox({
    required this._vsync,
    required this._image,
    required this._fit,
    required this._placeholderGradient,
  });

  double get _fadeValue {
    final fade = _fade;
    return fade == null ? 1 : Curves.easeOut.transform(fade.value);
  }

  void show(ui.Image? image, {required bool doFadeIn}) {
    final shown = _image;
    if (image == null ? shown == null : shown != null && image.isCloneOf(shown)) {
      return;
    }

    _previousImage?.dispose();
    _previousImage = null;
    _image = image?.clone();
    if (doFadeIn) {
      _previousImage = shown;
      final fade = _fade ??= AnimationController(vsync: _vsync, duration: const Duration(milliseconds: 100))
        ..addListener(markNeedsPaint)
        ..addStatusListener(_onFadeStatusChanged);
      if (!fade.isAnimating) {
        unawaited(fade.forward(from: 0));
      }
    } else {
      shown?.dispose();
      _fade?.value = 1;
    }
    markNeedsPaint();
  }

  void _onFadeStatusChanged(AnimationStatus status) {
    if (status.isCompleted) {
      _previousImage?.dispose();
      _previousImage = null;
    }
  }

  @override
  void dispose() {
    _fade?.dispose();
    _image?.dispose();
    _previousImage?.dispose();
    super.dispose();
  }

  @override
  void paint(PaintingContext context, Offset offset) {
    final rect = offset & size;
    final canvas = context.canvas;
    final fadeValue = _fadeValue;

    if (_previousImage != null && fadeValue < 1.0) {
      paintImage(
        canvas: canvas,
        rect: rect,
        image: _previousImage!,
        fit: _fit,
        filterQuality: FilterQuality.low,
        opacity: 1.0,
      );
    } else if (_image == null || fadeValue < 1.0) {
      final paint = Paint()..shader = _placeholderGradient.createShader(rect);
      canvas.drawRect(rect, paint);
    }

    if (_image != null) {
      paintImage(
        canvas: canvas,
        rect: rect,
        image: _image!,
        fit: _fit,
        filterQuality: FilterQuality.low,
        opacity: fadeValue,
      );
    }
  }

  @override
  void performLayout() {
    size = constraints.biggest;
  }

  set fit(BoxFit value) {
    if (_fit != value) {
      _fit = value;
      markNeedsPaint();
    }
  }

  set placeholderGradient(Gradient value) {
    if (_placeholderGradient != value) {
      _placeholderGradient = value;
      markNeedsPaint();
    }
  }
}
