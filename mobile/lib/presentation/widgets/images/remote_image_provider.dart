import 'dart:async';
import 'dart:ui';

import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/painting.dart';
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/providers/image/cache/image_loader.dart';
import 'package:immich_mobile/providers/image/cache/remote_image_cache_manager.dart';
import 'package:immich_mobile/utils/image_url_builder.dart';

class RemoteThumbProvider extends ImageProvider<RemoteThumbProvider> {
  final String assetId;
  final CacheManager? cacheManager;

  const RemoteThumbProvider({
    required this.assetId,
    this.cacheManager,
  });

  @override
  Future<RemoteThumbProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    RemoteThumbProvider key,
    ImageDecoderCallback decode,
  ) {
    final cache = cacheManager ?? RemoteImageCacheManager();
    final chunkController = StreamController<ImageChunkEvent>();
    return MultiFrameImageStreamCompleter(
      codec: _codec(key, cache, decode, chunkController),
      scale: 1.0,
      chunkEvents: chunkController.stream,
      informationCollector: () => <DiagnosticsNode>[
        DiagnosticsProperty<ImageProvider>('Image provider', this),
        DiagnosticsProperty<String>('Asset Id', key.assetId),
      ],
    );
  }

  Future<Codec> _codec(
    RemoteThumbProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkController,
  ) async {
    final preview = getThumbnailUrlForRemoteId(
      key.assetId,
    );

    return ImageLoader.loadImageFromCache(
      preview,
      cache: cache,
      decode: decode,
      chunkEvents: chunkController,
    ).whenComplete(chunkController.close);
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

class RemoteFullImageProvider extends ImageProvider<RemoteFullImageProvider> {
  final String assetId;
  final CacheManager? cacheManager;

  RemoteFullImageProvider({
    required this.assetId,
    this.cacheManager,
  });

  @override
  Future<RemoteFullImageProvider> obtainKey(ImageConfiguration configuration) {
    return SynchronousFuture(this);
  }

  @override
  ImageStreamCompleter loadImage(
    RemoteFullImageProvider key,
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

  Stream<Codec> _codec(
    RemoteFullImageProvider key,
    CacheManager cache,
    ImageDecoderCallback decode,
    StreamController<ImageChunkEvent> chunkController,
  ) async* {
    yield await ImageLoader.loadImageFromCache(
      getPreviewUrlForRemoteId(key.assetId),
      cache: cache,
      decode: decode,
      chunkEvents: chunkController,
    );

    if (AppSetting.get(Setting.loadOriginal)) {
      yield await ImageLoader.loadImageFromCache(
        getOriginalUrlForRemoteId(key.assetId),
        cache: cache,
        decode: decode,
        chunkEvents: chunkController,
      );
    }
    await chunkController.close();
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    if (other is RemoteFullImageProvider) {
      return assetId == other.assetId;
    }

    return false;
  }

  @override
  int get hashCode => assetId.hashCode;
}
