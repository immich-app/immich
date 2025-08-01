import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/presentation/widgets/images/image_provider.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/providers/image/cache/image_loader.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class RemoteThumbProvider extends ImageProvider<RemoteThumbProvider> {
  final String assetId;
  final CacheManager? cacheManager;

  const RemoteThumbProvider({required this.assetId, this.cacheManager});

  @override
  Future<RemoteThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteThumbProvider key, ImageDecoderCallback decode) {
    final cache = cacheManager ?? RemoteImageCacheManager();
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
    );
  }

  Future<Codec> _codec(RemoteThumbProvider key, CacheManager cache, ImageDecoderCallback decode) async {
    final preview = getThumbnailUrlForRemoteId(key.assetId);

    return ImageLoader.loadImageFromCache(preview, cache: cache, decode: decode);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteThumbProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}

class RemoteFullImageProvider extends ImageProvider<RemoteFullImageProvider> {
  final String assetId;
  final CacheManager? cacheManager;

  const RemoteFullImageProvider({required this.assetId, this.cacheManager});

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(RemoteFullImageProvider key, ImageDecoderCallback decode) {
    final cache = cacheManager ?? RemoteImageCacheManager();
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, cache, decode),
      initialImage: getCachedImage(RemoteThumbProvider(assetId: assetId)),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
    );
  }

  Stream<ImageInfo> _codec(RemoteFullImageProvider key, CacheManager cache, ImageDecoderCallback decode) async* {
    ImageInfo? imageInfo;
    final originalImageFuture = AppSetting.get(Setting.loadOriginal)
        ? ImageLoader.loadImageFromCache(
            getOriginalUrlForRemoteId(key.assetId),
            cache: cache,
            decode: decode,
          ).then((image) => image.getNextFrame()).then((frame) => imageInfo = ImageInfo(image: frame.image, scale: 1.0))
        : null;

    final previewImageFuture =
        ImageLoader.loadImageFromCache(getPreviewUrlForRemoteId(key.assetId), cache: cache, decode: decode)
            .then((image) async => imageInfo == null ? await image.getNextFrame() : null)
            .then((frame) => imageInfo == null ? ImageInfo(image: frame!.image, scale: 1.0) : null);

    final previewImage = await previewImageFuture;
    if (previewImage != null) {
      yield previewImage;
    }

    if (originalImageFuture != null) {
      yield await originalImageFuture;
    }
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteFullImageProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
