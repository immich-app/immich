import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/presentation/components/image/cache/cache_manager.dart';
import 'package:immich_mobile/presentation/components/image/cache/image_loader.dart';
import 'package:immich_mobile/utils/immich_image_url_helper.dart';

/// The remote image provider for full size remote images
class ImRemoteImageProvider extends ImageProvider<ImRemoteImageProvider> {
  /// The [Asset.remoteId] of the asset to fetch
  final String assetId;

  /// The image cache manager
  final CacheManager? cacheManager;

  const ImRemoteImageProvider({required this.assetId, this.cacheManager});

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImRemoteImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImRemoteImageProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ImRemoteImageCacheManager();
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    ImRemoteImageProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    // Load a preview to the chunk events
    final preview = ImImageUrlHelper.getThumbnailUrlForRemoteId(key.assetId);

    yield await ImageLoader.loadImageFromCache(
      preview,
      cache: cache,
      decode: decode,
      chunkEvents: chunkEvents,
    );

    // Load the higher resolution version of the image
    final url = ImImageUrlHelper.getThumbnailUrlForRemoteId(
      key.assetId,
      type: AssetMediaSize.preview,
    );
    final codec = await ImageLoader.loadImageFromCache(
      url,
      cache: cache,
      decode: decode,
      chunkEvents: chunkEvents,
    );
    yield codec;

    await chunkEvents.close();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImRemoteImageProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
