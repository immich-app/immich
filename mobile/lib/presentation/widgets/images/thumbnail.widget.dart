import 'dart:ui' as ui;

import 'package:flutter/material.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
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

  const Thumbnail({this.imageProvider, this.fit = BoxFit.cover, this.thumbhashProvider, super.key});

  Thumbnail.remote({required String remoteId, this.fit = BoxFit.cover, Size size = kThumbnailResolution, super.key})
    : imageProvider = RemoteThumbProvider(assetId: remoteId),
      thumbhashProvider = null;

  Thumbnail.fromAsset({
    required BaseAsset? asset,
    this.fit = BoxFit.cover,

    /// The logical UI size of the thumbnail. This is only used to determine the ideal image resolution and does not affect the widget size.
    Size size = kThumbnailResolution,
    super.key,
  }) : thumbhashProvider = switch (asset) {
         RemoteAsset() when asset.thumbHash != null && asset.localId == null => ThumbHashProvider(
           thumbHash: asset.thumbHash!,
         ),
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

class _ThumbnailState extends State<Thumbnail> with SingleTickerProviderStateMixin {
  ui.Image? _providerImage;
  ui.Image? _previousImage;

  late AnimationController _fadeController;
  late Animation<double> _fadeAnimation;

  ImageStream? _imageStream;
  ImageStreamListener? _imageStreamListener;
  ImageStream? _thumbhashStream;
  ImageStreamListener? _thumbhashStreamListener;

  static final _gradientCache = <ColorScheme, Gradient>{};

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(duration: const Duration(milliseconds: 100), vsync: this);
    _fadeAnimation = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _fadeController.addStatusListener(_onAnimationStatusChanged);
    _loadImage();
  }

  void _onAnimationStatusChanged(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      _previousImage?.dispose();
      _previousImage = null;
    }
  }

  void _loadFromThumbhashProvider() {
    _stopListeningToThumbhashStream();
    final thumbhashProvider = widget.thumbhashProvider;
    if (thumbhashProvider == null || _providerImage != null) return;

    final thumbhashStream = _thumbhashStream = thumbhashProvider.resolve(ImageConfiguration.empty);
    final thumbhashStreamListener = _thumbhashStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        _stopListeningToThumbhashStream();
        if (!mounted || _providerImage != null) {
          imageInfo.dispose();
          return;
        }
        _fadeController.value = 1.0;
        setState(() {
          _providerImage = imageInfo.image;
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
    if (imageProvider == null) return;

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

        if ((synchronousCall && _providerImage == null) || !_isVisible()) {
          _fadeController.value = 1.0;
        } else if (_fadeController.isAnimating) {
          _fadeController.forward();
        } else {
          _fadeController.forward(from: 0.0);
        }

        setState(() {
          _previousImage?.dispose();
          if (_providerImage != null) {
            _previousImage = _providerImage;
          } else {
            _previousImage = null;
          }
          _providerImage = imageInfo.image;
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
      if (_fadeController.isAnimating) {
        _fadeController.stop();
        _previousImage?.dispose();
        _previousImage = null;
      }
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
    if (renderObject == null || !renderObject.attached) return false;

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

    return AnimatedBuilder(
      animation: _fadeAnimation,
      builder: (context, child) {
        return _ThumbnailLeaf(
          image: _providerImage,
          previousImage: _previousImage,
          fadeValue: _fadeAnimation.value,
          fit: widget.fit,
          placeholderGradient: gradient,
        );
      },
    );
  }

  @override
  void dispose() {
    final imageProvider = widget.imageProvider;
    if (imageProvider is CancellableImageProvider) {
      imageProvider.cancel();
    }

    final thumbhashProvider = widget.thumbhashProvider;
    if (thumbhashProvider is CancellableImageProvider) {
      thumbhashProvider.cancel();
    }

    _fadeController.removeStatusListener(_onAnimationStatusChanged);
    _fadeController.dispose();
    _stopListeningToStream();
    _providerImage?.dispose();
    _previousImage?.dispose();
    super.dispose();
  }
}

class _ThumbnailLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final ui.Image? previousImage;
  final double fadeValue;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbnailLeaf({
    required this.image,
    required this.previousImage,
    required this.fadeValue,
    required this.fit,
    required this.placeholderGradient,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbnailRenderBox(
      image: image,
      previousImage: previousImage,
      fadeValue: fadeValue,
      fit: fit,
      placeholderGradient: placeholderGradient,
    );
  }

  @override
  void updateRenderObject(BuildContext context, _ThumbnailRenderBox renderObject) {
    renderObject
      ..image = image
      ..previousImage = previousImage
      ..fadeValue = fadeValue
      ..fit = fit
      ..placeholderGradient = placeholderGradient;
  }
}

class _ThumbnailRenderBox extends RenderBox {
  ui.Image? _image;
  ui.Image? _previousImage;
  double _fadeValue;
  BoxFit _fit;
  Gradient _placeholderGradient;

  @override
  bool isRepaintBoundary = true;

  _ThumbnailRenderBox({
    required ui.Image? image,
    required ui.Image? previousImage,
    required double fadeValue,
    required BoxFit fit,
    required Gradient placeholderGradient,
  }) : _image = image,
       _previousImage = previousImage,
       _fadeValue = fadeValue,
       _fit = fit,
       _placeholderGradient = placeholderGradient;

  @override
  void paint(PaintingContext context, Offset offset) {
    final rect = offset & size;
    final canvas = context.canvas;

    if (_previousImage != null && _fadeValue < 1.0) {
      paintImage(
        canvas: canvas,
        rect: rect,
        image: _previousImage!,
        fit: _fit,
        filterQuality: FilterQuality.low,
        opacity: 1.0,
      );
    } else if (_image == null || _fadeValue < 1.0) {
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
        opacity: _fadeValue,
      );
    }
  }

  @override
  void performLayout() {
    size = constraints.biggest;
  }

  set image(ui.Image? value) {
    if (_image != value) {
      _image = value;
      markNeedsPaint();
    }
  }

  set previousImage(ui.Image? value) {
    if (_previousImage != value) {
      _previousImage = value;
      markNeedsPaint();
    }
  }

  set fadeValue(double value) {
    if (_fadeValue != value) {
      _fadeValue = value;
      markNeedsPaint();
    }
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
