import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum CacheType {
  albumThumbnail,
  sharedAlbumThumbnail;
}

final cacheServiceProvider = Provider((_) => CacheService());

class CacheService {

  BaseCacheManager getCache(CacheType type) {
    return _getDefaultCache(type.name);
  }

  BaseCacheManager _getDefaultCache(String cacheName) {
    return CacheManager(Config(cacheName));
  }

}