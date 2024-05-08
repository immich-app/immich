import 'package:flutter_cache_manager/flutter_cache_manager.dart';

/// The cache manager for full size images [ImmichRemoteImageProvider]
class RemoteImageCacheManager extends CacheManager {
  static const key = 'remoteImageCacheKey';
  static final RemoteImageCacheManager _instance = RemoteImageCacheManager._();

  factory RemoteImageCacheManager() {
    return _instance;
  }

  RemoteImageCacheManager._()
      : super(
          Config(
            key,
            maxNrOfCacheObjects: 500,
            stalePeriod: const Duration(days: 30),
          ),
        );
}
