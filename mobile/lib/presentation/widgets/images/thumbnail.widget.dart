import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:immich_mobile/constants/constants.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/presentation/widgets/images/local_image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/remote_image_provider.dart';
import 'package:logging/logging.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;

final log = Logger('ThumbnailWidget');

enum ThumbhashMode { enabled, disabled, only }

class Thumbnail extends StatefulWidget {
  final ImageProvider? imageProvider;
  final BoxFit fit;
  final ui.Size size;
  final String? blurhash;
  final ThumbhashMode thumbhashMode;

  const Thumbnail({
    this.imageProvider,
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(kTimelineThumbnailSize),
    this.blurhash,
    this.thumbhashMode = ThumbhashMode.enabled,
    super.key,
  });

  Thumbnail.fromAsset({
    required Asset asset,
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(kTimelineThumbnailSize),
    this.thumbhashMode = ThumbhashMode.enabled,
    super.key,
  })  : blurhash = asset.thumbhash,
        imageProvider = _getImageProviderFromAsset(asset, size);

  Thumbnail.fromBaseAsset({
    required BaseAsset? asset,
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(kTimelineThumbnailSize),
    this.thumbhashMode = ThumbhashMode.enabled,
    super.key,
  })  : blurhash = switch (asset) {
          RemoteAsset() => asset.thumbHash,
          _ => null,
        },
        imageProvider = _getImageProviderFromBaseAsset(asset, size);

  static ImageProvider? _getImageProviderFromAsset(Asset asset, ui.Size size) {
    if (asset.localId != null) {
      return LocalThumbProvider(id: asset.localId!, size: size);
    } else if (asset.remoteId != null) {
      return RemoteThumbProvider(assetId: asset.remoteId!);
    }
    return null;
  }

  static ImageProvider? _getImageProviderFromBaseAsset(
    BaseAsset? asset,
    ui.Size size,
  ) {
    switch (asset) {
      case RemoteAsset():
        if (asset.localId != null) {
          return LocalThumbProvider(id: asset.localId!, size: size);
        } else {
          return RemoteThumbProvider(assetId: asset.id);
        }
      case LocalAsset():
        return LocalThumbProvider(id: asset.id, size: size);
      case null:
        return null;
    }
  }

  @override
  State<Thumbnail> createState() => _ThumbnailState();
}

class _ThumbnailState extends State<Thumbnail> {
  ui.Image? _thumbhashImage;
  ui.Image? _providerImage;
  ImageStream? _imageStream;
  ImageStreamListener? _imageStreamListener;

  static final _gradientCache = <ColorScheme, Gradient>{};

  @override
  void initState() {
    super.initState();
    _loadImage();
  }

  @override
  void didUpdateWidget(Thumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.imageProvider != widget.imageProvider ||
        oldWidget.blurhash != widget.blurhash ||
        (oldWidget.thumbhashMode == ThumbhashMode.disabled && oldWidget.thumbhashMode != ThumbhashMode.disabled)) {
      _loadImage();
    }
  }

  @override
  void reassemble() {
    super.reassemble();
    _loadImage();
  }

  void _loadImage() {
    _stopListeningToStream();
    if (widget.thumbhashMode != ThumbhashMode.disabled && widget.blurhash != null) {
      _decodeThumbhash();
    }

    if (widget.thumbhashMode != ThumbhashMode.only && widget.imageProvider != null) {
      _loadFromProvider();
    }
  }

  void _loadFromProvider() {
    final imageProvider = widget.imageProvider;
    if (imageProvider == null) return;

    _imageStream = imageProvider.resolve(ImageConfiguration.empty);
    _imageStreamListener = ImageStreamListener(
      (ImageInfo imageInfo, bool synchronousCall) {
        if (!mounted) return;

        _thumbhashImage?.dispose();
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
    _imageStream?.addListener(_imageStreamListener!);
  }

  void _stopListeningToStream() {
    if (_imageStreamListener != null && _imageStream != null) {
      _imageStream!.removeListener(_imageStreamListener!);
    }
    _imageStream = null;
    _imageStreamListener = null;
  }

  Future<void> _decodeThumbhash() async {
    final blurhash = widget.blurhash;
    if (blurhash == null || !mounted || _providerImage != null) {
      return;
    }

    try {
      final image = thumbhash.thumbHashToRGBA(base64.decode(blurhash));
      final buffer = await ImmutableBuffer.fromUint8List(image.rgba);
      if (!mounted || _providerImage != null) {
        buffer.dispose();
        return;
      }

      final descriptor = ImageDescriptor.raw(
        buffer,
        width: image.width,
        height: image.height,
        pixelFormat: PixelFormat.rgba8888,
      );

      final codec = await descriptor.instantiateCodec();

      if (!mounted || _providerImage != null) {
        buffer.dispose();
        descriptor.dispose();
        codec.dispose();
        return;
      }

      final frame = (await codec.getNextFrame()).image;
      buffer.dispose();
      descriptor.dispose();
      codec.dispose();

      if (!mounted || _providerImage != null) {
        frame.dispose();
        return;
      }

      setState(() {
        _providerImage = frame;
      });
    } catch (e) {
      log.severe('Error decoding thumbhash: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = context.colorScheme;
    final gradient = _gradientCache[colorScheme] ??= LinearGradient(
      colors: [
        colorScheme.surfaceContainer,
        colorScheme.surfaceContainer.darken(amount: .1),
      ],
      begin: Alignment.topCenter,
      end: Alignment.bottomCenter,
    );

    return _ThumbnailLeaf(
      image: _providerImage ?? _thumbhashImage,
      fit: widget.fit,
      placeholderGradient: gradient,
    );
  }

  @override
  void dispose() {
    _stopListeningToStream();
    _thumbhashImage?.dispose();
    super.dispose();
  }
}

class _ThumbnailLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbnailLeaf({
    required this.image,
    required this.fit,
    required this.placeholderGradient,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbnailRenderBox(
      image: image,
      fit: fit,
      placeholderGradient: placeholderGradient,
    );
  }

  @override
  void updateRenderObject(
    BuildContext context,
    _ThumbnailRenderBox renderObject,
  ) {
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

  _ThumbnailRenderBox({
    required ui.Image? image,
    required BoxFit fit,
    required Gradient placeholderGradient,
  })  : _image = image,
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
        // _previousImage?.dispose();
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
      _fadeStartTime = DateTime.now();
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
}
