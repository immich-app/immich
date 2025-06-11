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

class ImRemoteThumbProvider extends ImageProvider<ImRemoteThumbProvider> {
  final String assetId;
  final double height;
  final double width;
  final CacheManager? cacheManager;

  ImRemoteThumbProvider({
    required this.assetId,
    this.height = kTimelineFixedTileExtend,
    this.width = kTimelineFixedTileExtend,
    this.cacheManager,
  });

  @override
  Future<ImRemoteThumbProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImRemoteThumbProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
    );
  }

  Stream<Codec> _codec(
    ImRemoteThumbProvider key,
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
    if (other is ImRemoteThumbProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
