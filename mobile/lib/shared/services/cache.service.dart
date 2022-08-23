import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

enum CacheType {
  // Shared cache for asset thumbnails in various modules
  thumbnail(cacheSize: 10000),

  imageViewerPreview(cacheSize: 800),
  imageViewerFull(cacheSize: 400),
  albumThumbnail(cacheSize: 1000),
  sharedAlbumThumbnail(cacheSize: 1000);

  const CacheType({this.cacheSize = 200});
  final int cacheSize;
}

final cacheServiceProvider = Provider((_) => CacheService());

class CacheService {
  BaseCacheManager getCache(CacheType type) {
    return _getDefaultCache(type.name, type.cacheSize);
  }

  BaseCacheManager _getDefaultCache(String cacheName, int size) {
    return CacheManager(
      Config(
        cacheName,
        maxNrOfCacheObjects: size,
      ),
    );
  }
}
