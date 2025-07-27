import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/providers/image/exceptions/image_loading_exception.dart';
import 'package:logging/logging.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final AssetMediaRepository _assetMediaRepository = const AssetMediaRepository();
  final CacheManager? cacheManager;

  final String id;
  final DateTime updatedAt;
  final String name;
  final Size size;

  const LocalThumbProvider({
    required this.id,
    required this.updatedAt,
    required this.name,
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
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<DateTime>('Updated at', key.updatedAt),
        DiagnosticsProperty<String>('Name', key.name),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  Future<Codec> _codec(
    LocalThumbProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async {
    final cacheKey = '${key.id}-${key.updatedAt}-${key.size.width}x${key.size.height}';

    final fileFromCache = await cache.getFileFromCache(cacheKey);
    if (fileFromCache != null) {
      try {
        final buffer = await ImmutableBuffer.fromFilePath(fileFromCache.file.path);
        return decode(buffer);
      } catch (_) {}
    }

    final thumbnailBytes = await _assetMediaRepository.getThumbnail(key.id, size: key.size);
    if (thumbnailBytes == null) {
      PaintingBinding.instance.imageCache.evict(key);
      throw StateError(
        "Loading thumb for local photo ${key.name} failed",
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
      return id == other.id && updatedAt == other.updatedAt;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ updatedAt.hashCode;
}

class LocalFullImageProvider extends ImageProvider<LocalFullImageProvider> {
  final AssetMediaRepository _assetMediaRepository = const AssetMediaRepository();
  final StorageRepository _storageRepository = const StorageRepository();

  final String id;
  final String name;
  final Size size;
  final AssetType type;

  const LocalFullImageProvider({
    required this.id,
    required this.name,
    required this.size,
    required this.type,
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
    return MultiImageStreamCompleter(
      codec: _codec(key, decode),
      scale: 1.0,
      informationCollector: () sync* {
        yield ErrorDescription(name);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<Codec> _codec(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
  ) async* {
    try {
      switch (key.type) {
        case AssetType.image:
          yield* _decodeProgressive(key, decode);
          break;
        case AssetType.video:
          final codec = await _getThumbnailCodec(key, decode);
          if (codec == null) {
            throw StateError("Failed to load preview for ${key.name}");
          }
          yield codec;
          break;
        case AssetType.other:
        case AssetType.audio:
          throw StateError('Unsupported asset type ${key.type}');
      }
    } catch (error, stack) {
      Logger('ImmichLocalImageProvider').severe('Error loading local image ${key.name}', error, stack);
      throw const ImageLoadingException(
        'Could not load image from local storage',
      );
    }
  }

  Future<Codec?> _getThumbnailCodec(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
  ) async {
    final thumbBytes = await _assetMediaRepository.getThumbnail(key.id, size: key.size);
    if (thumbBytes == null) {
      return null;
    }
    final buffer = await ImmutableBuffer.fromUint8List(thumbBytes);
    return decode(buffer);
  }

  Stream<Codec> _decodeProgressive(
    LocalFullImageProvider key,
    ImageDecoderCallback decode,
  ) async* {
    final file = await _storageRepository.getFileForAsset(key.id);
    if (file == null) {
      throw StateError("Opening file for asset ${key.name} failed");
    }

    final fileSize = await file.length();
    final devicePixelRatio = PlatformDispatcher.instance.views.first.devicePixelRatio;
    final isLargeFile = fileSize > 20 * 1024 * 1024; // 20MB
    final isHEIC = file.path.toLowerCase().contains(RegExp(r'\.(heic|heif)$'));
    final isProgressive = isLargeFile || (isHEIC && !Platform.isIOS);

    if (isProgressive) {
      try {
        final progressiveMultiplier = devicePixelRatio >= 3.0 ? 1.3 : 1.2;
        final size = Size(
          (key.size.width * progressiveMultiplier).clamp(256, 1024),
          (key.size.height * progressiveMultiplier).clamp(256, 1024),
        );
        final mediumThumb = await _assetMediaRepository.getThumbnail(key.id, size: size);
        if (mediumThumb != null) {
          final mediumBuffer = await ImmutableBuffer.fromUint8List(mediumThumb);
          yield await decode(mediumBuffer);
        }
      } catch (_) {}
    }

    // Load original only when the file is smaller or if the user wants to load original images
    // Or load a slightly larger image for progressive loading
    if (isProgressive && !(AppSetting.get(Setting.loadOriginal))) {
      final progressiveMultiplier = devicePixelRatio >= 3.0 ? 2.0 : 1.6;
      final size = Size(
        (key.size.width * progressiveMultiplier).clamp(512, 2048),
        (key.size.height * progressiveMultiplier).clamp(512, 2048),
      );
      final highThumb = await _assetMediaRepository.getThumbnail(key.id, size: size);
      if (highThumb != null) {
        final highBuffer = await ImmutableBuffer.fromUint8List(highThumb);
        yield await decode(highBuffer);
      }
      return;
    }

    final buffer = await ImmutableBuffer.fromFilePath(file.path);
    yield await decode(buffer);
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalFullImageProvider) {
      return id == other.id && size == other.size && type == other.type && name == other.name;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ size.hashCode ^ type.hashCode ^ name.hashCode;
}
