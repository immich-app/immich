import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:logging/logging.dart';

class ImLocalThumbnailProvider extends ImageProvider<ImLocalThumbnailProvider> {
  final Logger _log = Logger("ImLocalThumbnailProvider");
  final IAssetMediaRepository _assetMediaRepository =
      const AssetMediaRepository();
  final CacheManager? cacheManager;

  final LocalAsset asset;
  final double height;
  final double width;

  ImLocalThumbnailProvider({
    required this.asset,
    this.height = kTimelineFixedTileExtend,
    this.width = kTimelineFixedTileExtend,
    this.cacheManager,
  });

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImLocalThumbnailProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImLocalThumbnailProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
      informationCollector: () sync* {
        yield ErrorDescription(key.asset.name);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<Codec> _codec(
    ImLocalThumbnailProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async* {
    final cacheKey = '${key.asset.id}-${key.asset.updatedAt}-${width}x$height';

    final fileFromCache = await cache.getFileFromCache(cacheKey);
    if (fileFromCache != null) {
      try {
        final buffer =
            await ImmutableBuffer.fromFilePath(fileFromCache.file.path);
        final codec = await decode(buffer);
        yield codec;
        return;
      } catch (error) {
        _log.severe('Found thumbnail in cache, but loading it failed', error);
      }
    }

    final thumbnailBytes = await _assetMediaRepository.getThumbnail(
      key.asset.id,
      size: Size(key.width, key.height),
    );
    if (thumbnailBytes == null) {
      throw StateError(
        "Loading thumb for local photo ${key.asset.name} failed",
      );
    }

    final buffer = await ImmutableBuffer.fromUint8List(thumbnailBytes);
    final codec = await decode(buffer);
    yield codec;
    await cache.putFile(cacheKey, thumbnailBytes);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImLocalThumbnailProvider) {
      return asset.id == other.asset.id &&
          asset.updatedAt == other.asset.updatedAt;
    }
    return false;
  }

  @override
  int get hashCode => Object.hash(asset.id, asset.updatedAt);
}
