import 'dart:ffi';

import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:convert';
import 'dart:ui' as ui;
import 'dart:ui';

import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/extensions/build_context_extensions.dart';
import 'package:immich_mobile/extensions/theme_extensions.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/providers/infrastructure/platform.provider.dart';
import 'package:immich_mobile/services/api.service.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:logging/logging.dart';
import 'package:thumbhash/thumbhash.dart' as thumbhash;
import 'package:ffi/ffi.dart';

final log = Logger('ThumbnailWidget');

class Thumbnail extends StatefulWidget {
  final BoxFit fit;
  final ui.Size size;
  final String? blurhash;
  final String? localId;
  final String? remoteId;
  final bool thumbhashOnly;

  const Thumbnail({
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(256),
    this.blurhash,
    this.localId,
    this.remoteId,
    this.thumbhashOnly = false,
    super.key,
  });

  Thumbnail.fromAsset({
    required Asset asset,
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(256),
    this.thumbhashOnly = false,
    super.key,
  })  : blurhash = asset.thumbhash,
        localId = asset.localId,
        remoteId = asset.remoteId;

  Thumbnail.fromBaseAsset({
    required BaseAsset? asset,
    this.fit = BoxFit.cover,
    this.size = const ui.Size.square(256),
    this.thumbhashOnly = false,
    super.key,
  })  : blurhash = switch (asset) {
          RemoteAsset() => asset.thumbHash,
          _ => null,
        },
        localId = switch (asset) {
          RemoteAsset() => asset.localId,
          LocalAsset() => asset.id,
          _ => null,
        },
        remoteId = switch (asset) {
          RemoteAsset() => asset.id,
          LocalAsset() => asset.remoteId,
          _ => null,
        };

  @override
  State<Thumbnail> createState() => _ThumbnailState();
}

class _ThumbnailState extends State<Thumbnail> {
  ui.Image? _image;

  static final _gradientCache = <ColorScheme, Gradient>{};
  static final _imageCache = ThumbnailImageCacheManager();

  @override
  void initState() {
    super.initState();
    _decode();
  }

  @override
  void didUpdateWidget(Thumbnail oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.blurhash != widget.blurhash ||
        oldWidget.localId != widget.localId ||
        oldWidget.remoteId != widget.remoteId ||
        oldWidget.thumbhashOnly != widget.thumbhashOnly) {
      _decode();
    }
  }

  Future<void> _decode() async {
    if (!mounted) {
      return;
    }

    final thumbhashOnly = widget.thumbhashOnly;
    final blurhash = widget.blurhash;
    final imageFuture = thumbhashOnly ? Future.value(null) : _decodeFromFile();

    if (blurhash != null) {
      final image = thumbhash.thumbHashToRGBA(base64.decode(blurhash));
      try {
        await _decodeThumbhash(
          await ImmutableBuffer.fromUint8List(image.rgba),
          image.width,
          image.height,
        );
      } catch (e) {
        log.info('Error decoding thumbhash for ${widget.remoteId}: $e');
      }
    }

    if (!mounted || thumbhashOnly) {
      return;
    }

    try {
      final image = await imageFuture;
      if (!mounted || image == null) {
        return;
      }

      _image?.dispose();
      setState(() {
        _image = image;
      });
    } catch (e) {
      log.info('Error decoding thumbnail: $e');
    }
  }

  Future<void> _decodeThumbhash(
    ImmutableBuffer buffer,
    int width,
    int height,
  ) async {
    if (!mounted) {
      buffer.dispose();
      return;
    }

    final descriptor = ImageDescriptor.raw(
      buffer,
      width: width,
      height: height,
      pixelFormat: PixelFormat.rgba8888,
    );
    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      return;
    }

    final codec = await descriptor.instantiateCodec(
      targetWidth: width,
      targetHeight: height,
    );

    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      codec.dispose();
      return;
    }

    final frame = (await codec.getNextFrame()).image;
    buffer.dispose();
    descriptor.dispose();
    codec.dispose();
    if (!mounted) {
      frame.dispose();
      return;
    }
    setState(() {
      _image = frame;
    });
  }

  Future<ui.Image?> _decodeFromFile() async {
    final buffer = await _getFile();
    if (buffer == null) {
      return null;
    }
    final stopwatch = Stopwatch()..start();
    final thumb = await _decodeThumbnail(buffer, 256, 256);
    stopwatch.stop();
    return thumb;
  }

  Future<ui.Image?> _decodeThumbnail(
    ImmutableBuffer buffer,
    int width,
    int height,
  ) async {
    if (!mounted) {
      buffer.dispose();
      return null;
    }

    final descriptor = ImageDescriptor.raw(
      buffer,
      width: width,
      height: height,
      pixelFormat: PixelFormat.rgba8888,
    );

    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      return null;
    }

    final codec = await descriptor.instantiateCodec(
      targetWidth: width,
      targetHeight: height,
    );

    if (!mounted) {
      buffer.dispose();
      descriptor.dispose();
      codec.dispose();
      return null;
    }

    final frame = (await codec.getNextFrame()).image;
    buffer.dispose();
    descriptor.dispose();
    codec.dispose();
    if (!mounted) {
      frame.dispose();
      return null;
    }

    return frame;
  }

  Future<ImmutableBuffer?> _getFile() async {
    final stopwatch = Stopwatch()..start();
    final localId = widget.localId;
    if (localId != null) {
      final size = 256 * 256 * 4;
      final pointer = malloc<Uint8>(size);
      try {
        await thumbnailApi.setThumbnailToBuffer(
          pointer.address,
          localId,
          width: 256,
          height: 256,
        );
        stopwatch.stop();
        log.info(
          'Retrieved local image $localId in ${stopwatch.elapsedMilliseconds.toStringAsFixed(2)} ms',
        );
        return await ImmutableBuffer.fromUint8List(pointer.asTypedList(size));
      } catch (e) {
        log.warning('Failed to retrieve local image $localId: $e');
      } finally {
        malloc.free(pointer);
      }
    }

    final remoteId = widget.remoteId;
    if (remoteId != null) {
      final uri = getThumbnailUrlForRemoteId(remoteId);
      final headers = ApiService.getRequestHeaders();
      final stream = _imageCache.getFileStream(
        uri,
        key: uri,
        withProgress: true,
        headers: headers,
      );

      await for (final result in stream) {
        if (!mounted) {
          return null;
        }

        if (result is FileInfo) {
          stopwatch.stop();
          log.info(
            'Retrieved remote image $remoteId in ${stopwatch.elapsedMilliseconds.toStringAsFixed(2)} ms',
          );
          return ImmutableBuffer.fromFilePath(result.file.path);
        }
      }
    }

    return null;
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

    return _ThumbhashLeaf(
      image: _image,
      fit: widget.fit,
      placeholderGradient: gradient,
    );
  }

  @override
  void dispose() {
    _image?.dispose();
    super.dispose();
  }
}

class _ThumbhashLeaf extends LeafRenderObjectWidget {
  final ui.Image? image;
  final BoxFit fit;
  final Gradient placeholderGradient;

  const _ThumbhashLeaf({
    required this.image,
    required this.fit,
    required this.placeholderGradient,
  });

  @override
  RenderObject createRenderObject(BuildContext context) {
    return _ThumbhashRenderBox(
      image: image,
      fit: fit,
      placeholderGradient: placeholderGradient,
    );
  }

  @override
  void updateRenderObject(
    BuildContext context,
    _ThumbhashRenderBox renderObject,
  ) {
    renderObject.fit = fit;
    renderObject.image = image;
    renderObject.placeholderGradient = placeholderGradient;
  }
}

class _ThumbhashRenderBox extends RenderBox {
  ui.Image? _image;
  BoxFit _fit;
  Gradient _placeholderGradient;

  @override
  bool isRepaintBoundary = true;

  _ThumbhashRenderBox({
    required ui.Image? image,
    required BoxFit fit,
    required Gradient placeholderGradient,
  })  : _image = image,
        _fit = fit,
        _placeholderGradient = placeholderGradient;

  @override
  void paint(PaintingContext context, Offset offset) {
    final image = _image;
    final rect = offset & size;
    if (image == null) {
      final paint = Paint();
      paint.shader = _placeholderGradient.createShader(rect);
      context.canvas.drawRect(rect, paint);
      return;
    }

    paintImage(
      canvas: context.canvas,
      rect: rect,
      image: image,
      fit: _fit,
      filterQuality: FilterQuality.low,
    );
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
