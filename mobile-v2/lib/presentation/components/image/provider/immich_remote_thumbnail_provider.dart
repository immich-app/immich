import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/presentation/components/image/cache/cache_manager.dart';
import 'package:immich_mobile/presentation/components/image/cache/image_loader.dart';
import 'package:immich_mobile/utils/immich_image_url_helper.dart';

/// The remote image provider
class ImmichRemoteThumbnailProvider
    extends ImageProvider<ImmichRemoteThumbnailProvider> {
  /// The [Asset.remoteId] of the asset to fetch
  final String assetId;

  final int? height;
  final int? width;

  /// The image cache manager
  final CacheManager? cacheManager;

  const ImmichRemoteThumbnailProvider({
    required this.assetId,
    this.height,
    this.width,
    this.cacheManager,
  });

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImmichRemoteThumbnailProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImmichRemoteThumbnailProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ImRemoteThumbnailCacheManager();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    ImmichRemoteThumbnailProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async* {
    final preview = ImImageUrlHelper.getThumbnailUrlForRemoteId(key.assetId);

    yield await ImageLoader.loadImageFromCache(
      preview,
      cache: cache,
      decode: decode,
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImmichRemoteThumbnailProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
