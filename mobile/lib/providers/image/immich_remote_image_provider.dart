import 'dart:async';
import 'dart:ui' as ui;

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/providers/image/cache/image_loader.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:openapi/api.dart' as api;

import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/entities/asset.entity.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

/// The remote image provider for full size remote images
class ImmichRemoteImageProvider
    extends ImageProvider<ImmichRemoteImageProvider> {
  /// The [Asset.remoteId] of the asset to fetch
  final String assetId;

  /// The image cache manager
  final CacheManager? cacheManager;

  ImmichRemoteImageProvider({
    required this.assetId,
    this.cacheManager,
  });

  /// Converts an [ImageProvider]'s settings plus an [ImageConfiguration] to a key
  /// that describes the precise image to load.
  @override
  Future<ImmichRemoteImageProvider> obtainKey(
    ImageConfiguration configuration,
  ) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    ImmichRemoteImageProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? RemoteImageCacheManager();
    final chunkEvents = StreamController<ImageChunkEvent>();
    return MultiImageStreamCompleter(
      codec: _codec(key, cache, decode, chunkEvents),
      scale: 1.0,
      chunkEvents: chunkEvents.stream,
    );
  }

  /// Whether to show the original file or load a compressed version
  bool get _useOriginal => Store.get(
        AppSettingsEnum.loadOriginal.storeKey,
        AppSettingsEnum.loadOriginal.defaultValue,
      );

  /// Whether to load the preview thumbnail first or not
  bool get _loadPreview => Store.get(
        AppSettingsEnum.loadPreview.storeKey,
        AppSettingsEnum.loadPreview.defaultValue,
      );

  // Streams in each stage of the image as we ask for it
  Stream<ui.Codec> _codec(
    ImmichRemoteImageProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkEvents,
  ) async* {
    // Load a preview to the chunk events
    if (_loadPreview) {
      final preview = getThumbnailUrlForRemoteId(
        key.assetId,
        type: api.ThumbnailFormat.WEBP,
      );

      yield await ImageLoader.loadImageFromCache(
        preview,
        cache: cache,
        decode: decode,
        chunkEvents: chunkEvents,
      );
    }

    // Load the higher resolution version of the image
    final url = getThumbnailUrlForRemoteId(
      key.assetId,
      type: api.ThumbnailFormat.JPEG,
    );
    final codec = await ImageLoader.loadImageFromCache(
      url,
      cache: cache,
      decode: decode,
      chunkEvents: chunkEvents,
    );
    yield codec;

    // Load the final remote image
    if (_useOriginal) {
      // Load the original image
      final url = getImageUrlFromId(key.assetId);
      final codec = await ImageLoader.loadImageFromCache(
        url,
        cache: cache,
        decode: decode,
        chunkEvents: chunkEvents,
      );
      yield codec;
    }
    await chunkEvents.close();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is ImmichRemoteImageProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
