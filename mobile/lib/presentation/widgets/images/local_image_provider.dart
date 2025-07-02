import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/providers/image/exceptions/image_loading_exception.dart';
import 'package:logging/logging.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final AssetMediaRepository _assetMediaRepository =
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
        return decode(buffer);
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
  final AssetMediaRepository _assetMediaRepository =
      const AssetMediaRepository();
  final StorageRepository _storageRepository = const StorageRepository();

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
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
      informationCollector: () sync* {
        yield ErrorDescription(asset.name);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<Codec> _codec(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    try {
      switch (key.asset.type) {
        case AssetType.image:
          yield* _decodeImageAdvanced(key, decode, chunkEvents);
          break;
        case AssetType.video:
          final thumbBytes = await _assetMediaRepository
              .getThumbnail(key.asset.id, size: key.size);
          if (thumbBytes == null) {
            throw StateError("Failed to load preview for ${key.asset.name}");
          }
          final buffer = await ImmutableBuffer.fromUint8List(thumbBytes);
          yield await decode(buffer);
          break;
        case AssetType.other:
        case AssetType.audio:
          throw StateError('Unsupported asset type ${key.asset.type}');
      }
    } catch (error, stack) {
      Logger('ImmichLocalImageProvider')
          .severe('Error loading local image ${key.asset.name}', error, stack);
      throw const ImageLoadingException(
        'Could not load image from local storage',
      );
    } finally {
      chunkEvents.close();
    }
  }

  /// Additional optimizations that can be enabled based on requirements
  Stream<Codec> _decodeImageAdvanced(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    final file = await _storageRepository.getFileForAsset(key.asset);
    if (file == null) {
      throw StateError("Opening file for asset ${key.asset.name} failed");
    }

    final filePath = file.path;
    final fileExtension = filePath.toLowerCase();
    final isHEIC =
        fileExtension.endsWith('.heic') || fileExtension.endsWith('.heif');
    final fileSize = await file.length();

    // For very large images, use progressive loading
    if (fileSize > 20 * 1024 * 1024) {
      // 20MB+
      Logger('LocalFullImageProvider').info(
        'Large file detected (${fileSize ~/ (1024 * 1024)}MB), using progressive loading',
      );

      // Step 1: Load a medium resolution version first
      try {
        final mediumThumb = await _assetMediaRepository
            .getThumbnail(key.asset.id, size: const Size(2048, 2048));
        if (mediumThumb != null) {
          final mediumBuffer = await ImmutableBuffer.fromUint8List(mediumThumb);
          yield await decode(mediumBuffer);

          chunkEvents.add(
            ImageChunkEvent(
              cumulativeBytesLoaded: fileSize ~/ 3,
              expectedTotalBytes: fileSize,
            ),
          );
        }
      } catch (e) {
        Logger('LocalFullImageProvider')
            .warning('Medium resolution preview failed: $e');
      }
    }

    // Size-aware decoding: Use smaller target size for HEIC if the requested size is small
    if (isHEIC && (key.size.width < 1920 && key.size.height < 1920)) {
      // For smaller target sizes, use thumbnail instead of full resolution
      try {
        final targetSize = Size(
          (key.size.width * 1.5).clamp(1024, 2048),
          (key.size.height * 1.5).clamp(1024, 2048),
        );

        final optimizedBytes = await _assetMediaRepository
            .getThumbnail(key.asset.id, size: targetSize);

        if (optimizedBytes != null) {
          final buffer = await ImmutableBuffer.fromUint8List(optimizedBytes);
          yield await decode(buffer);
          return;
        }
      } catch (e) {
        Logger('LocalFullImageProvider')
            .info('Size-optimized decoding failed, using full resolution');
      }
    }

    // Final: Load full resolution
    chunkEvents.add(
      ImageChunkEvent(
        cumulativeBytesLoaded: (fileSize * 0.8).round(),
        expectedTotalBytes: fileSize,
      ),
    );

    final buffer = await ImmutableBuffer.fromFilePath(filePath);
    yield await decode(buffer);

    chunkEvents.add(
      ImageChunkEvent(
        cumulativeBytesLoaded: fileSize,
        expectedTotalBytes: fileSize,
      ),
    );
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalFullImageProvider) {
      return asset.id == other.asset.id &&
          asset.updatedAt == other.asset.updatedAt &&
          size == other.size;
    }
    return false;
  }

  @override
  int get hashCode =>
      asset.id.hashCode ^ asset.updatedAt.hashCode ^ size.hashCode;
}
