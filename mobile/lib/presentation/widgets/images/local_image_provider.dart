import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/animated_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';

class LocalThumbProvider extends CancellableImageProvider<LocalThumbProvider>
    with CancellableImageProviderMixin<LocalThumbProvider> {
  final String id;
  final Size size;
  final AssetType assetType;

  // an on-device edit/revert keeps the same id but changes the bytes, so the checksum
  // is what keys a cached thumbnail to its render.
  final String? checksum;

  LocalThumbProvider({required this.id, required this.assetType, this.checksum, this.size = kThumbnailResolution});

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalThumbProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
      onLastListenerRemoved: cancel,
    );
  }

  Stream<ImageInfo> _codec(LocalThumbProvider key, ImageDecoderCallback decode) {
    final request = this.request = LocalImageRequest(localId: key.id, size: key.size, assetType: key.assetType);
    return loadRequest(request, decode, isFinal: true);
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
  int get hashCode => id.hashCode ^ checksum.hashCode;
}

class LocalFullImageProvider extends CancellableImageProvider<LocalFullImageProvider>
    with CancellableImageProviderMixin<LocalFullImageProvider> {
  final String id;
  final Size size;
  final AssetType assetType;
  final bool isAnimated;
  final String? checksum;

  LocalFullImageProvider({
    required this.id,
    required this.assetType,
    required this.size,
    required this.isAnimated,
    this.checksum,
  });

  @override
  Future<LocalFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalFullImageProvider key, ImageDecoderCallback decode) {
    if (key.isAnimated) {
      return AnimatedImageStreamCompleter(
        stream: _animatedCodec(key, decode),
        scale: 1.0,
        initialImage: getInitialImage(LocalThumbProvider(id: key.id, assetType: key.assetType, checksum: key.checksum)),
        informationCollector: () => <DiagnosticsNode>[
          DiagnosticsProperty<ImageProvider>('Image provider', this),
          DiagnosticsProperty<String>('Id', key.id),
          DiagnosticsProperty<Size>('Size', key.size),
          DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
        ],
        onLastListenerRemoved: cancel,
      );
    }

    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      initialImage: getInitialImage(LocalThumbProvider(id: key.id, assetType: key.assetType, checksum: key.checksum)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<Size>('Size', key.size),
        DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
      ],
      onLastListenerRemoved: cancel,
    );
  }

  Stream<ImageInfo> _codec(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* initialImageStream();

    if (isCancelled) {
      return;
    }

    final loadOriginal = SettingsRepository.instance.appConfig.image.loadOriginal;
    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    var request = this.request = LocalImageRequest(
      localId: key.id,
      size: Size(size.width * devicePixelRatio, size.height * devicePixelRatio),
      assetType: key.assetType,
    );
    yield* loadRequest(request, decode, isFinal: !loadOriginal);

    if (!loadOriginal) {
      return;
    }

    if (isCancelled) {
      return;
    }

    request = this.request = LocalImageRequest(localId: key.id, assetType: key.assetType, size: Size.zero);

    yield* loadRequest(request, decode, isFinal: true);
  }

  Stream<Object> _animatedCodec(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* initialImageStream();

    if (isCancelled) {
      return;
    }

    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    final previewRequest = request = LocalImageRequest(
      localId: key.id,
      size: Size(size.width * devicePixelRatio, size.height * devicePixelRatio),
      assetType: key.assetType,
    );
    yield* loadRequest(previewRequest, decode, isFinal: false);

    if (isCancelled) {
      return;
    }

    // always try original for animated, since previews don't support animation
    final originalRequest = request = LocalImageRequest(localId: key.id, size: Size.zero, assetType: key.assetType);
    final codec = await loadCodecRequest(originalRequest, isFinal: true);
    if (codec == null) {
      if (isCancelled) {
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
      return id == other.id && size == other.size && isAnimated == other.isAnimated && checksum == other.checksum;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ size.hashCode ^ isAnimated.hashCode ^ checksum.hashCode;
}
