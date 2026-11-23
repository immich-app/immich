import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/loaders/image_request.dart';
import 'package:immich_mobile/infrastructure/repositories/settings.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/animated_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';
import 'package:openapi/api.dart';

class RemoteImageProvider extends ImageProvider<RemoteImageProvider> {
  final String url;
  final bool edited;

  /// Physical size to decode, or null for the source size.
  final Size? decodeSize;

  const RemoteImageProvider({required this.url, this.edited = true, this.decodeSize});

  RemoteImageProvider.thumbnail({
    required String assetId,
    required String thumbhash,
    this.edited = true,
    this.decodeSize,
  }) : url = getThumbnailUrlForRemoteId(assetId, thumbhash: thumbhash, edited: edited);

  @override
  Future<RemoteImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteImageProvider key, ImageDecoderCallback decode) {
    final loader = ImageLoader(key);
    return OneFramePlaceholderImageStreamCompleter(
      _codec(loader, key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('URL', key.url),
      ],
      onLastListenerRemoved: loader.cancel,
    );
  }

  Stream<ImageInfo> _codec(ImageLoader loader, RemoteImageProvider key, ImageDecoderCallback decode) {
    final request = loader.request = RemoteImageRequest(uri: key.url, decodeSize: key.decodeSize);
    return loader.loadRequest(request, decode, isFinal: true);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is RemoteImageProvider) {
      return url == other.url && edited == other.edited && decodeSize == other.decodeSize;
    }
    return false;
  }

  @override
  int get hashCode => url.hashCode ^ edited.hashCode ^ decodeSize.hashCode;
}

class RemoteFullImageProvider extends ImageProvider<RemoteFullImageProvider> {
  final String assetId;
  final String thumbhash;
  final AssetType assetType;
  final bool isAnimated;
  final bool edited;
  final bool previewOnly;

  /// Physical size of the thumbnail shown before the preview.
  final Size? thumbnailSize;

  const RemoteFullImageProvider({
    required this.assetId,
    required this.thumbhash,
    required this.assetType,
    required this.isAnimated,
    this.edited = true,
    this.previewOnly = false,
    this.thumbnailSize,
  });

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteFullImageProvider key, ImageDecoderCallback decode) {
    final loader = ImageLoader(key);
    if (key.isAnimated) {
      return AnimatedImageStreamCompleter(
        stream: _animatedCodec(loader, key, decode),
        scale: 1.0,
        initialImage: loader.getInitialImage(
          RemoteImageProvider.thumbnail(assetId: key.assetId, thumbhash: key.thumbhash, decodeSize: key.thumbnailSize),
        ),
        informationCollector: () => <DiagnosticsNode>[
          DiagnosticsProperty<ImageProvider>('Image provider', this),
          DiagnosticsProperty<String>('Asset Id', key.assetId),
          DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
        ],
        onLastListenerRemoved: loader.cancel,
      );
    }

    return OneFramePlaceholderImageStreamCompleter(
      _codec(loader, key, decode),
      initialImage: key.previewOnly
          ? null
          : loader.getInitialImage(
              RemoteImageProvider.thumbnail(
                assetId: key.assetId,
                thumbhash: key.thumbhash,
                edited: key.edited,
                decodeSize: key.thumbnailSize,
              ),
            ),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
        DiagnosticsProperty<bool>('isAnimated', key.isAnimated),
      ],
      onLastListenerRemoved: loader.cancel,
    );
  }

  Stream<ImageInfo> _codec(ImageLoader loader, RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* loader.initialImageStream();

    if (loader.isCancelled) {
      return;
    }

    final loadOriginal = assetType == AssetType.image && SettingsRepository.instance.appConfig.image.loadOriginal;
    final previewOnlyKey = RemoteFullImageProvider(
      assetId: key.assetId,
      thumbhash: key.thumbhash,
      assetType: key.assetType,
      isAnimated: key.isAnimated,
      edited: key.edited,
      previewOnly: true,
    );
    if (!key.previewOnly && PaintingBinding.instance.imageCache.statusForKey(previewOnlyKey).tracked) {
      yield* loader.loadProvider(previewOnlyKey);
    } else {
      final previewRequest = loader.request = _previewRequest(key);
      yield* loader.loadRequest(previewRequest, decode, isFinal: !loadOriginal || key.previewOnly);
    }

    if (!loadOriginal || key.previewOnly) {
      return;
    }

    if (loader.isCancelled) {
      return;
    }

    final originalRequest = loader.request = _originalRequest(key);
    yield* loader.loadRequest(originalRequest, decode, isFinal: true);
  }

  Stream<Object> _animatedCodec(ImageLoader loader, RemoteFullImageProvider key, ImageDecoderCallback decode) async* {
    yield* loader.initialImageStream();

    if (loader.isCancelled) {
      return;
    }

    final previewRequest = loader.request = _previewRequest(key);
    yield* loader.loadRequest(previewRequest, decode, isFinal: false);

    if (loader.isCancelled) {
      return;
    }

    // always try original for animated, since previews don't support animation
    final originalRequest = loader.request = _originalRequest(key);
    final codec = await loader.loadCodecRequest(originalRequest, isFinal: true);
    if (codec == null) {
      if (loader.isCancelled) {
        return;
      }
      throw StateError('Failed to load animated codec for asset ${key.assetId}');
    }
    yield codec;
  }

  RemoteImageRequest _previewRequest(RemoteFullImageProvider key) => RemoteImageRequest(
    uri: getThumbnailUrlForRemoteId(
      key.assetId,
      type: AssetMediaSize.preview,
      thumbhash: key.thumbhash,
      edited: key.edited,
    ),
  );

  RemoteImageRequest _originalRequest(RemoteFullImageProvider key) =>
      RemoteImageRequest(uri: getOriginalUrlForRemoteId(key.assetId, edited: key.edited));

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) {
      return true;
    }
    if (other is RemoteFullImageProvider) {
      return assetId == other.assetId &&
          thumbhash == other.thumbhash &&
          isAnimated == other.isAnimated &&
          edited == other.edited &&
          previewOnly == other.previewOnly;
    }

    return false;
  }

  @override
  int get hashCode => Object.hash(assetId, thumbhash, isAnimated, edited, previewOnly);
}
