import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

enum CacheType {
  // Shared cache for asset thumbnails in various modules
  thumbnail,

  imageViewerPreview,
  imageViewerFull,
  albumThumbnail,
  sharedAlbumThumbnail;
}

final cacheServiceProvider = Provider(
  (ref) => CacheService(ref.watch(appSettingsServiceProvider)),
);

class CacheService {
  final AppSettingsService _settingsService;

  CacheService(this._settingsService);

  BaseCacheManager getCache(CacheType type) {
    return _getDefaultCache(type.name, _getCacheSize(type) + 1);
  }

  void emptyAllCaches() {
    for (var type in CacheType.values) {
      getCache(type).emptyCache();
    }
  }
  
  int _getCacheSize(CacheType type) {
    switch (type) {
      case CacheType.thumbnail:
        return _settingsService.getSetting(AppSettingsEnum.thumbnailCacheSize);
      case CacheType.imageViewerPreview:
      case CacheType.imageViewerFull:
        return _settingsService.getSetting(AppSettingsEnum.imageCacheSize);
      case CacheType.sharedAlbumThumbnail:
      case CacheType.albumThumbnail:
        return _settingsService.getSetting(AppSettingsEnum.albumThumbnailCacheSize);
      default:
        return 200;
    }
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
