import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/thumb_hash_provider.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:logging/logging.dart';

final log = Logger('ThumbnailWidget');

enum ThumbhashMode { enabled, disabled, only }

class Thumbnail extends StatefulWidget {
  final ImageProvider? imageProvider;
  final ImageProvider? thumbhashProvider;
  final BoxFit fit;
  final ThumbhashMode thumbhashMode;

  const Thumbnail({
    this.imageProvider,
    this.fit = BoxFit.cover,
    this.thumbhashProvider,
    this.thumbhashMode = ThumbhashMode.enabled,
    super.key,
  });

  Thumbnail.fromAsset({
    required BaseAsset? asset,
    this.fit = BoxFit.cover,
    Size size = kThumbnailResolution,
    this.thumbhashMode = ThumbhashMode.enabled,
    super.key,
  }) : thumbhashProvider = switch (asset) {
         RemoteAsset() when asset.thumbHash != null => ThumbHashProvider(thumbHash: asset.thumbHash!),
         _ => null,
       },
       imageProvider = switch (asset) {
         RemoteAsset() =>
           asset.localId == null
               ? RemoteThumbProvider(assetId: asset.id)
               : LocalThumbProvider(id: asset.localId!, size: size, assetType: asset.type),
         LocalAsset() => LocalThumbProvider(id: asset.id, size: size, assetType: asset.type),
         _ => null,
       };

  @override
  State<Thumbnail> createState() => _ThumbnailState();
}

class _ThumbnailState extends State<Thumbnail> {
  ui.Image? _providerImage;
  ImageStream? _imageStream;
  ImageStreamListener? _imageStreamListener;
  ImageStream? _thumbhashStream;
  ImageStreamListener? _thumbhashStreamListener;

  static final _gradientCache = <ColorScheme, Gradient>{};

  @override
  void initState() {
    _loadImage();
    super.initState();
  }

  @override
  void didUpdateWidget(Thumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.imageProvider != oldWidget.imageProvider) {
      _loadFromImageProvider();
    }

    if (_providerImage == null &&
            (oldWidget.thumbhashMode == ThumbhashMode.disabled && widget.thumbhashMode != ThumbhashMode.disabled) ||
        (widget.thumbhashMode != ThumbhashMode.disabled && oldWidget.thumbhashProvider != widget.thumbhashProvider)) {
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

  void _loadFromThumbhashProvider() {
    _stopListeningToThumbhashStream();
    final thumbhashProvider = widget.thumbhashProvider;
    if (thumbhashProvider == null || widget.thumbhashMode == ThumbhashMode.disabled || _providerImage != null) return;

    final thumbhashStream = _thumbhashStream = thumbhashProvider.resolve(ImageConfiguration.empty);
    final thumbhashStreamListener = _thumbhashStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        if (!mounted || _providerImage != null) return;

        setState(() {
          _providerImage = imageInfo.image;
        });
      },
      onError: (exception, stackTrace) {
        log.severe('Error loading thumbhash: $exception', exception, stackTrace);
      },
    );
    thumbhashStream.addListener(thumbhashStreamListener);
  }

  void _loadFromImageProvider() {
    _stopListeningToImageStream();
    final imageProvider = widget.imageProvider;
    if (imageProvider == null || widget.thumbhashMode == ThumbhashMode.only) return;

    final imageStream = _imageStream = imageProvider.resolve(ImageConfiguration.empty);
    final imageStreamListener = _imageStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        _stopListeningToThumbhashStream();
        if (!mounted) return;

        if (_providerImage != imageInfo.image) {
          setState(() {
            _providerImage = imageInfo.image;
          });
        }
      },
      onError: (exception, stackTrace) {
        log.severe('Error loading image: $exception', exception, stackTrace);
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
  Widget build(BuildContext context) {
    final colorScheme = context.colorScheme;
    final gradient = _gradientCache[colorScheme] ??= LinearGradient(
      colors: [colorScheme.surfaceContainer, colorScheme.surfaceContainer.darken(amount: .1)],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return _ThumbnailLeaf(image: _providerImage, fit: widget.fit, placeholderGradient: gradient);
  }

  @override
  void dispose() {
    _stopListeningToStream();
    _providerImage?.dispose();
    super.dispose();
  }
}

class _ThumbnailLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbnailLeaf({required this.image, required this.fit, required this.placeholderGradient});

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbnailRenderBox(image: image, fit: fit, placeholderGradient: placeholderGradient);
  }

  @override
  void updateRenderObject(BuildContext context, _ThumbnailRenderBox renderObject) {
    renderObject.fit = fit;
    renderObject.image = image;
    renderObject.placeholderGradient = placeholderGradient;
  }
}

class _ThumbnailRenderBox extends RenderBox {
  ui.Image? _image;
  ui.Image? _previousImage;
  BoxFit _fit;
  Gradient _placeholderGradient;
  DateTime _lastImageRequest;

  double _crossFadeProgress = 1.0;
  static const _fadeDuration = Duration(milliseconds: 100);
  DateTime? _fadeStartTime;

  @override
  bool isRepaintBoundary = true;

  _ThumbnailRenderBox({required ui.Image? image, required BoxFit fit, required Gradient placeholderGradient})
    : _image = image,
      _fit = fit,
      _placeholderGradient = placeholderGradient,
      _lastImageRequest = DateTime.now();

  @override
  void paint(PaintingContext context, Offset offset) {
    final rect = offset & size;
    final canvas = context.canvas;

    if (_fadeStartTime != null) {
      final elapsed = DateTime.now().difference(_fadeStartTime!);
      _crossFadeProgress = (elapsed.inMilliseconds / _fadeDuration.inMilliseconds).clamp(0.0, 1.0);

      if (_crossFadeProgress < 1.0) {
        SchedulerBinding.instance.scheduleFrameCallback((_) {
          markNeedsPaint();
        });
      } else {
        _previousImage?.dispose();
        _previousImage = null;
        _fadeStartTime = null;
      }
    }

    if (_previousImage != null && _crossFadeProgress < 1.0) {
      paintImage(
        canvas: canvas,
        rect: rect,
        image: _previousImage!,
        fit: _fit,
        filterQuality: FilterQuality.low,
        opacity: 1.0 - _crossFadeProgress,
      );
    } else if (_image == null) {
      final paint = Paint();
      paint.shader = _placeholderGradient.createShader(rect);
      canvas.drawRect(rect, paint);
    }

    if (_image != null) {
      paintImage(
        canvas: canvas,
        rect: rect,
        image: _image!,
        fit: _fit,
        filterQuality: FilterQuality.low,
        opacity: _crossFadeProgress,
      );
    }
  }

  @override
  void performLayout() {
    size = constraints.biggest;
  }

  set image(ui.Image? value) {
    if (_image == value) {
      return;
    }

    final time = DateTime.now();
    if (time.difference(_lastImageRequest).inMilliseconds >= 16) {
      _fadeStartTime = time;
      _previousImage = _image;
    }
    _image = value;
    _lastImageRequest = time;
    markNeedsPaint();
  }

  set fit(BoxFit value) {
    if (_fit == value) {
      return;
    }

    _fit = value;
    if (_image != null) {
      markNeedsPaint();
    }
  }

  set placeholderGradient(Gradient value) {
    if (_placeholderGradient == value) {
      return;
    }

    _placeholderGradient = value;
    if (_image == null) {
      markNeedsPaint();
    }
  }

  @override
  dispose() {
    _previousImage?.dispose();
    super.dispose();
  }
}
