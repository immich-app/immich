import 'dart:async';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/interfaces/asset_media.interface.dart';
import 'package:immich_mobile/domain/interfaces/storage.interface.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/providers/image/exceptions/image_loading_exception.dart';
import 'package:logging/logging.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final IAssetMediaRepository _assetMediaRepository =
      const AssetMediaRepository();
  final CacheManager? cacheManager;

  final LocalAsset asset;
  final Size size;

  const LocalThumbProvider({
    required this.asset,
    this.size = const Size.square(kTimelineFixedTileExtent),
    this.cacheManager,
  });

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
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
    final cacheKey =
        '${key.asset.id}-${key.asset.updatedAt}-${key.size.width}x${key.size.height}';

    final fileFromCache = await cache.getFileFromCache(cacheKey);
    if (fileFromCache != null) {
      try {
        final buffer =
            await ImmutableBuffer.fromFilePath(fileFromCache.file.path);
        return await decode(buffer);
      } catch (_) {}
    }

    final thumbnailBytes =
        await _assetMediaRepository.getThumbnail(key.asset.id, size: key.size);
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

class LocalFullImageProvider extends ImageProvider<LocalFullImageProvider> {
  final IAssetMediaRepository _assetMediaRepository =
      const AssetMediaRepository();
  final IStorageRepository _storageRepository = const StorageRepository();

  final LocalAsset asset;
  final Size size;

  const LocalFullImageProvider({
    required this.asset,
    required this.size,
  });

  @override
  Future<LocalFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
  ) {
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, decode),
      scale: 1.0,
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<LocalAsset>('Asset', key.asset),
      ],
    );
  }

  // Streams in each stage of the image as we ask for it
  Future<Codec> _codec(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
  ) async {
    try {
      switch (key.asset.type) {
        case AssetType.image:
          final file = await _storageRepository.getFileForAsset(key.asset);
          if (file == null) {
            throw StateError("Opening file for asset ${key.asset.name} failed");
          }
          final buffer = await ImmutableBuffer.fromFilePath(file.path);
          return decode(buffer);
        case AssetType.video:
          final thumbBytes = await _assetMediaRepository
              .getThumbnail(key.asset.id, size: key.size);
          if (thumbBytes == null) {
            throw StateError("Failed to load preview for ${key.asset.name}");
          }
          final buffer = await ImmutableBuffer.fromUint8List(thumbBytes);
          return decode(buffer);
        case AssetType.other:
        case AssetType.audio:
          throw StateError('Unsupported asset type ${key.asset.type}');
      }
    } catch (error, stack) {
      Logger('ImmichLocalImageProvider')
          .severe('Error loading local image ${key.asset.name}', error, stack);
    }
    throw ImageLoadingException('Could not load image from local storage');
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalFullImageProvider) {
      return asset.id == other.asset.id;
    }
    return false;
  }

  @override
  int get hashCode => asset.id.hashCode;
}
