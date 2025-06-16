import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/image_loader.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class RemoteThumbProvider extends ImageProvider<RemoteThumbProvider> {
  final String assetId;
  final double height;
  final double width;
  final CacheManager? cacheManager;

  RemoteThumbProvider({
    required this.assetId,
    this.height = kTimelineFixedTileExtent,
    this.width = kTimelineFixedTileExtent,
    this.cacheManager,
  });

  @override
  Future<RemoteThumbProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    RemoteThumbProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
    );
  }

  Stream<Codec> _codec(
    RemoteThumbProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async* {
    final preview = getThumbnailUrlForRemoteId(
      key.assetId,
    );

    yield await ImageLoader.loadImageFromCache(
      preview,
      cache: cache,
      decode: decode,
    );
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
