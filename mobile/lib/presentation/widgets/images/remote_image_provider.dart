import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/presentation/widgets/images/animated_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class RemoteImageProvider extends CancellableImageProvider<RemoteImageProvider>
    with CancellableImageProviderMixin<RemoteImageProvider> {
  final String url;

  RemoteImageProvider({required this.url});

  RemoteImageProvider.thumbnail({required String assetId, required String thumbhash})
    : url = getThumbnailUrlForRemoteId(assetId, thumbhash: thumbhash);

  @override
  Future<RemoteImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteImageProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('URL', key.url),
      ],
      onLastListenerRemoved: cancel,
    );
  }

  Stream<ImageInfo> _codec(RemoteImageProvider key, ImageDecoderCallback decode) {
    final request = this.request = RemoteImageRequest(uri: key.url);
    return loadRequest(request, decode);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteImageProvider) {
      return url == other.url;
    }
    return false;
  }

  @override
  int get hashCode => url.hashCode;
}

class RemoteFullImageProvider extends CancellableImageProvider<RemoteFullImageProvider>
    with CancellableImageProviderMixin<RemoteFullImageProvider> {
  final String assetId;
  final String thumbhash;
  final AssetType assetType;
  final bool isAnimated;

  RemoteFullImageProvider({
    required this.assetId,
    required this.thumbhash,
    required this.assetType,
    required this.isAnimated,
  });

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteFullImageProvider key, ImageDecoderCallback decode) {
    if (key.isAnimated) {
      return AnimatedImageStreamCompleter(
        stream: _animatedCodec(key, decode),
        scale: 1.0,
        initialImage: getInitialImage(RemoteImageProvider.thumbnail(assetId: key.assetId, thumbhash: key.thumbhash)),
        informationCollector: () => <DiagnosticsNode>[
          DiagnosticsProperty<ImageProvider>('Image provider', this),
          DiagnosticsProperty<String>('Asset Id', key.assetId),
          DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
        ],
        onLastListenerRemoved: cancel,
      );
    }

    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      initialImage: getInitialImage(RemoteImageProvider.thumbnail(assetId: key.assetId, thumbhash: key.thumbhash)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
        DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
      ],
      onLastListenerRemoved: cancel,
    );
  }

  Stream<ImageInfo> _codec(RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* initialImageStream();

    if (isCancelled) {
      PaintingBinding.instance.imageCache.evict(this);
      return;
    }

    final previewRequest = request = RemoteImageRequest(
      uri: getThumbnailUrlForRemoteId(key.assetId, type: AssetMediaSize.preview, thumbhash: key.thumbhash),
    );
    final loadOriginal = assetType == AssetType.image && AppSetting.get(Setting.loadOriginal);
    yield* loadRequest(previewRequest, decode, evictOnError: !loadOriginal);

    if (!loadOriginal) {
      return;
    }

    if (isCancelled) {
      PaintingBinding.instance.imageCache.evict(this);
      return;
    }

    final originalRequest = request = RemoteImageRequest(uri: getOriginalUrlForRemoteId(key.assetId));
    yield* loadRequest(originalRequest, decode);
  }

  Stream<Object> _animatedCodec(RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* initialImageStream();

    if (isCancelled) {
      PaintingBinding.instance.imageCache.evict(this);
      return;
    }

    final previewRequest = request = RemoteImageRequest(
      uri: getThumbnailUrlForRemoteId(key.assetId, type: AssetMediaSize.preview, thumbhash: key.thumbhash),
    );
    yield* loadRequest(previewRequest, decode, evictOnError: false);

    if (isCancelled) {
      PaintingBinding.instance.imageCache.evict(this);
      return;
    }

    // always try original for animated, since previews don't support animation
    final originalRequest = request = RemoteImageRequest(uri: getOriginalUrlForRemoteId(key.assetId));
    final codec = await loadCodecRequest(originalRequest);
    if (codec == null) {
      throw StateError('Failed to load animated codec for asset ${key.assetId}');
    }
    yield codec;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteFullImageProvider) {
      return assetId == other.assetId && thumbhash == other.thumbhash && isAnimated == other.isAnimated;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode ^ thumbhash.hashCode ^ isAnimated.hashCode;
}
