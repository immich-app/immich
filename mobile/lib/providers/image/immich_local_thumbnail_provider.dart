import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/providers/image/cache/thumbnail_image_cache_manager.dart';

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:photo_manager/photo_manager.dart' show ThumbnailSize;

/// The local image provider for an asset
/// Only viable
class ImmichLocalThumbnailProvider
    extends ImageProvider<ImmichLocalThumbnailProvider> {
  final Asset asset;
  final int height;
  final int width;

  /// The image cache manager
  final CacheManager? cacheManager;

  ImmichLocalThumbnailProvider({
    required this.asset,
    this.height = 256,
    this.width = 256,
    this.cacheManager,
  }) : assert(asset.local != null, 'Only usable when asset.local is set');

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImmichLocalThumbnailProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImmichLocalThumbnailProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? ThumbnailImageCacheManager();
    return MultiImageStreamCompleter(
      codec: _codec(key.asset, cache, decode),
      scale: 1.0,
      informationCollector: () sync* {
        yield ErrorDescription(asset.fileName);
      },
    );
  }

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    Asset key,
    CacheManager cache,
    ImageDecoderCallback decode,
  ) async* {
    final cacheKey = '${key.id}_${width}x$height';
    final file = await cache.getFileFromCache(cacheKey);
    if (file?.file.existsSync() == true) {
      final bytes = await file!.file.readAsBytes();
      final buffer = await ui.ImmutableBuffer.fromUint8List(bytes);
      final codec = await decode(buffer);
      yield codec;
      return;
    }

    final thumbnailBytes =
        await asset.local?.thumbnailDataWithSize(ThumbnailSize(width, height));
    if (thumbnailBytes == null) {
      throw StateError(
        "Loading thumb for local photo ${asset.fileName} failed",
      );
    }
    final buffer = await ui.ImmutableBuffer.fromUint8List(thumbnailBytes);
    final codec = await decode(buffer);
    yield codec;
    await cache.putFile(cacheKey, thumbnailBytes);
  }

  @override
  bool operator ==(Object other) {
    if (other is! ImmichLocalThumbnailProvider) return false;
    if (identical(this, other)) return true;
    return asset == other.asset;
  }

  @override
  int get hashCode => asset.hashCode;
}
