// ignore: depend_on_referenced_packages
import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';
import 'package:immich_mobile/utils/immich_cache_info_repository.dart';

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
  final _cacheRepositoryInstances = <CacheType, ImmichCacheRepository>{};

  CacheService(this._settingsService);

  BaseCacheManager getCache(CacheType type) {
    return _getDefaultCache(
      type.name,
      _getCacheSize(type) + 1,
      getCacheRepo(type),
    );
  }

  ImmichCacheRepository getCacheRepo(CacheType type) {
    if (!_cacheRepositoryInstances.containsKey(type)) {
      final repo = ImmichCacheInfoRepository(
        "cache_${type.name}",
        "cacheKeys_${type.name}",
      );
      _cacheRepositoryInstances[type] = repo;
    }

    return _cacheRepositoryInstances[type]!;
  }

  Future<void> emptyAllCaches() async {
    for (var type in CacheType.values) {
      await getCache(type).emptyCache();
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
        return _settingsService
            .getSetting(AppSettingsEnum.albumThumbnailCacheSize);
      default:
        return 200;
    }
  }

  BaseCacheManager _getDefaultCache(
    String cacheName,
    int size,
    CacheInfoRepository repo,
  ) {
    return CacheManager(
      Config(
        cacheName,
        maxNrOfCacheObjects: size,
        repo: repo,
      ),
    );
  }
}
