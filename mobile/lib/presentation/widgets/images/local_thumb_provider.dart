import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final IAssetMediaRepository _assetMediaRepository =
      const AssetMediaRepository();
  final CacheManager? cacheManager;

  final LocalAsset asset;
  final double height;
  final double width;

  LocalThumbProvider({
    required this.asset,
    this.height = kTimelineFixedTileExtent,
    this.width = kTimelineFixedTileExtent,
    this.cacheManager,
  });

  @override
  Future<LocalThumbProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    LocalThumbProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<LocalAsset>('Asset', key.asset),
      ],
    );
  }

  Future<Codec> _codec(
    LocalThumbProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async {
    final cacheKey = '${key.asset.id}-${key.asset.updatedAt}-${width}x$height';

    final fileFromCache = await cache.getFileFromCache(cacheKey);
    if (fileFromCache != null) {
      try {
        final buffer =
            await ImmutableBuffer.fromFilePath(fileFromCache.file.path);
        return await decode(buffer);
      } catch (_) {}
    }

    final thumbnailBytes = await _assetMediaRepository.getThumbnail(
      key.asset.id,
      size: Size(key.width, key.height),
    );
    if (thumbnailBytes == null) {
      PaintingBinding.instance.imageCache.evict(key);
      throw StateError(
        "Loading thumb for local photo ${key.asset.name} failed",
      );
    }

    final buffer = await ImmutableBuffer.fromUint8List(thumbnailBytes);
    unawaited(cache.putFile(cacheKey, thumbnailBytes));
    return decode(buffer);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalThumbProvider) {
      return asset.id == other.asset.id &&
          asset.updatedAt == other.asset.updatedAt;
    }
    return false;
  }

  @override
  int get hashCode => asset.id.hashCode ^ asset.updatedAt.hashCode;
}
