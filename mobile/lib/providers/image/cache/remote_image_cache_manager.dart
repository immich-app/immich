import 'package:flutter_cache_manager/flutter_cache_manager.dart';

class RemoteImageCacheManager extends CacheManager {
  static const key = 'remoteImageCacheKey';
  static final RemoteImageCacheManager _instance = RemoteImageCacheManager._();
  static final _config = Config(key, maxNrOfCacheObjects: 500, stalePeriod: const Duration(days: 30));

  factory RemoteImageCacheManager() {
    return _instance;
  }

  RemoteImageCacheManager._() : super(_config);
}

class RemoteThumbnailCacheManager extends CacheManager {
  static const key = 'remoteThumbnailCacheKey';
  static final RemoteThumbnailCacheManager _instance = RemoteThumbnailCacheManager._();
  static final _config = Config(key, maxNrOfCacheObjects: 5000, stalePeriod: const Duration(days: 30));

  factory RemoteThumbnailCacheManager() {
    return _instance;
  }

  RemoteThumbnailCacheManager._() : super(_config);
}
