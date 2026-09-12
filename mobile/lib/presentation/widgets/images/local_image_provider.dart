import 'dart:math' as math;

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/animated_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';

// iOS GPU textures max out at 16384px; larger images squish.
const _kMaxPixelSize = 16384;

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final String id;
  final Size size;
  final AssetType assetType;

  // an edit on the device keeps the id and changes the bytes, so the checksum is what separates two renders
  final String? checksum;

  const LocalThumbProvider({
    required this.id,
    required this.assetType,
    this.checksum,
    this.size = kThumbnailResolution,
  });

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalThumbProvider key, ImageDecoderCallback decode) {
    final loader = ImageLoader(key);
    return OneFramePlaceholderImageStreamCompleter(
      _codec(loader, key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
      onLastListenerRemoved: loader.cancel,
    );
  }

  Stream<ImageInfo> _codec(ImageLoader loader, LocalThumbProvider key, ImageDecoderCallback decode) {
    final request = loader.request = LocalImageRequest(localId: key.id, size: key.size, assetType: key.assetType);
    return loader.loadRequest(request, decode, isFinal: true);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is LocalThumbProvider) {
      return id == other.id && checksum == other.checksum;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(id, checksum);
}

class LocalFullImageProvider extends ImageProvider<LocalFullImageProvider> {
  final String id;
  final Size size;
  final AssetType assetType;
  final bool isAnimated;
  final int? width;
  final int? height;
  final String? checksum;

  const LocalFullImageProvider({
    required this.id,
    required this.assetType,
    required this.size,
    required this.isAnimated,
    this.width,
    this.height,
    this.checksum,
  });

  Size _previewTarget(double dpr, bool previewIsFinal) =>
      previewTargetSize(size.width * dpr, size.height * dpr, width, height, previewIsFinal: previewIsFinal);

  // Use an aspect-correct target when aspectFill would exceed the texture limit.
  @visibleForTesting
  static Size previewTargetSize(double boxW, double boxH, int? width, int? height, {required bool previewIsFinal}) {
    if (width == null || height == null || width <= 0 || height <= 0) {
      return Size(boxW, boxH);
    }
    final imgLong = math.max(width, height).toDouble();
    final coverLong = imgLong * math.max(boxW / width, boxH / height);
    if (coverLong <= _kMaxPixelSize) {
      return Size(boxW, boxH);
    }
    final bound = previewIsFinal ? _kMaxPixelSize.toDouble() : math.max(boxW, boxH);
    final scale = math.min(1.0, bound / imgLong);
    return Size(math.max(1.0, width * scale), math.max(1.0, height * scale));
  }

  @override
  Future<LocalFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalFullImageProvider key, ImageDecoderCallback decode) {
    final loader = ImageLoader(key);
    if (key.isAnimated) {
      return AnimatedImageStreamCompleter(
        stream: _animatedCodec(loader, key, decode),
        scale: 1.0,
        initialImage: loader.getInitialImage(
          LocalThumbProvider(id: key.id, assetType: key.assetType, checksum: key.checksum),
        ),
        informationCollector: () => <DiagnosticsNode>[
          DiagnosticsProperty<ImageProvider>('Image provider', this),
          DiagnosticsProperty<String>('Id', key.id),
          DiagnosticsProperty<Size>('Size', key.size),
          DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
        ],
        onLastListenerRemoved: loader.cancel,
      );
    }

    return OneFramePlaceholderImageStreamCompleter(
      _codec(loader, key, decode),
      initialImage: loader.getInitialImage(
        LocalThumbProvider(id: key.id, assetType: key.assetType, checksum: key.checksum),
      ),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
        DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
      ],
      onLastListenerRemoved: loader.cancel,
    );
  }

  Stream<ImageInfo> _codec(ImageLoader loader, LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* loader.initialImageStream();

    if (loader.isCancelled) {
      return;
    }

    final loadOriginal = SettingsRepository.instance.appConfig.image.loadOriginal;
    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    var request = loader.request = LocalImageRequest(
      localId: key.id,
      size: _previewTarget(devicePixelRatio, !loadOriginal),
      assetType: key.assetType,
    );
    yield* loader.loadRequest(request, decode, isFinal: !loadOriginal);

    if (!loadOriginal) {
      return;
    }

    if (loader.isCancelled) {
      return;
    }

    request = loader.request = LocalImageRequest(localId: key.id, assetType: key.assetType, size: Size.zero);

    yield* loader.loadRequest(request, decode, isFinal: true);
  }

  Stream<Object> _animatedCodec(ImageLoader loader, LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* loader.initialImageStream();

    if (loader.isCancelled) {
      return;
    }

    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    final previewRequest = loader.request = LocalImageRequest(
      localId: key.id,
      size: _previewTarget(devicePixelRatio, false),
      assetType: key.assetType,
    );
    yield* loader.loadRequest(previewRequest, decode, isFinal: false);

    if (loader.isCancelled) {
      return;
    }

    // always try original for animated, since previews don't support animation
    final originalRequest = loader.request = LocalImageRequest(
      localId: key.id,
      size: Size.zero,
      assetType: key.assetType,
    );
    final codec = await loader.loadCodecRequest(originalRequest, isFinal: true);
    if (codec == null) {
      if (loader.isCancelled) {
        return;
      }
      throw StateError('Failed to load animated codec for local asset ${key.id}');
    }
    yield codec;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is LocalFullImageProvider) {
      return id == other.id &&
          size == other.size &&
          isAnimated == other.isAnimated &&
          width == other.width &&
          height == other.height &&
          checksum == other.checksum;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(id, size, isAnimated, width, height, checksum);
}
