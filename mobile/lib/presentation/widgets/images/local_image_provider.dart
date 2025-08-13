import 'dart:async';
import 'dart:io';
import 'dart:ui';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/asset/base_asset.model.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/extensions/codec_extensions.dart';
import 'package:immich_mobile/infrastructure/repositories/asset_media.repository.dart';
import 'package:immich_mobile/infrastructure/repositories/storage.repository.dart';
import 'package:immich_mobile/presentation/widgets/images/one_frame_multi_image_stream_completer.dart';
import 'package:immich_mobile/presentation/widgets/timeline/constants.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';
import 'package:immich_mobile/providers/image/exceptions/image_loading_exception.dart';
import 'package:logging/logging.dart';

class LocalThumbProvider extends ImageProvider<LocalThumbProvider> {
  final AssetMediaRepository _assetMediaRepository = const AssetMediaRepository();
  final CacheManager? cacheManager;

  final String id;
  final DateTime updatedAt;
  final Size size;

  const LocalThumbProvider({
    required this.id,
    required this.updatedAt,
    this.size = kThumbnailResolution,
    this.cacheManager,
  });

  @override
  Future<LocalThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalThumbProvider key, ImageDecoderCallback decode) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, cache, decode),
      scale: 1.0,
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<DateTime>('Updated at', key.updatedAt),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  Future<Codec> _codec(LocalThumbProvider key, CacheManager cache, ImageDecoderCallback decode) async {
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
      throw StateError("Loading thumb for local photo ${key.id} failed");
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
  final Size size;
  final AssetType type;
  final DateTime updatedAt; // temporary, only exists to fetch cached thumbnail until local disk cache is removed

  const LocalFullImageProvider({required this.id, required this.size, required this.type, required this.updatedAt});

  @override
  Future<LocalFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(LocalFullImageProvider key, ImageDecoderCallback decode) {
    return OneFramePlaceholderImageStreamCompleter(
      _codec(key, decode),
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<String>('Id', key.id),
        DiagnosticsProperty<DateTime>('Updated at', key.updatedAt),
        DiagnosticsProperty<Size>('Size', key.size),
      ],
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ImageInfo> _codec(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    try {
      // First, yield the thumbnail image from LocalThumbProvider
      final thumbProvider = LocalThumbProvider(id: key.id, updatedAt: key.updatedAt);
      try {
        final thumbCodec = await thumbProvider._codec(
          thumbProvider,
          thumbProvider.cacheManager ?? ThumbnailImageCacheManager(),
          decode,
        );
        final thumbImageInfo = await thumbCodec.getImageInfo();
        yield thumbImageInfo;
      } catch (_) {}

      // Then proceed with the main image loading stream
      final mainStream = switch (key.type) {
        AssetType.image => _decodeProgressive(key, decode),
        AssetType.video => _getThumbnailCodec(key, decode),
        _ => throw StateError('Unsupported asset type ${key.type}'),
      };

      await for (final imageInfo in mainStream) {
        yield imageInfo;
      }
    } catch (error, stack) {
      Logger('ImmichLocalImageProvider').severe('Error loading local image ${key.id}', error, stack);
      throw const ImageLoadingException('Could not load image from local storage');
    }
  }

  Stream<ImageInfo> _getThumbnailCodec(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    final thumbBytes = await _assetMediaRepository.getThumbnail(key.id, size: key.size);
    if (thumbBytes == null) {
      throw StateError("Failed to load preview for ${key.id}");
    }
    final buffer = await ImmutableBuffer.fromUint8List(thumbBytes);
    final codec = await decode(buffer);
    yield await codec.getImageInfo();
  }

  Stream<ImageInfo> _decodeProgressive(LocalFullImageProvider key, ImageDecoderCallback decode) async* {
    final file = await _storageRepository.getFileForAsset(key.id);
    if (file == null) {
      throw StateError("Opening file for asset ${key.id} failed");
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
          final codec = await decode(mediumBuffer);
          yield await codec.getImageInfo();
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
        final codec = await decode(highBuffer);
        yield await codec.getImageInfo();
      }
      return;
    }

    final buffer = await ImmutableBuffer.fromFilePath(file.path);
    final codec = await decode(buffer);
    yield await codec.getImageInfo();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is LocalFullImageProvider) {
      return id == other.id && size == other.size && type == other.type;
    }
    return false;
  }

  @override
  int get hashCode => id.hashCode ^ size.hashCode ^ type.hashCode;
}
