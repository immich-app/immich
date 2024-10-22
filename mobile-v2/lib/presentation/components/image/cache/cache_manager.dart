import 'package:flutter_cache_manager/flutter_cache_manager.dart';
import 'package:immich_mobile/utils/constants/globals.dart';

/// The cache manager for thumbnail images [ImRemoteThumbnailProvider]
class ImRemoteThumbnailCacheManager extends CacheManager {
  static final ImRemoteThumbnailCacheManager _instance =
      ImRemoteThumbnailCacheManager._();

  factory ImRemoteThumbnailCacheManager() {
    return _instance;
  }

  ImRemoteThumbnailCacheManager._()
      : super(
          Config(
            kCacheThumbnailsKey,
            stalePeriod: const Duration(days: kCacheStalePeriod),
            maxNrOfCacheObjects: kCacheMaxNrOfThumbnails,
          ),
        );
}

/// The cache manager for full size images [ImRemoteImageProvider]
class ImRemoteImageCacheManager extends CacheManager {
  static final ImRemoteImageCacheManager _instance =
      ImRemoteImageCacheManager._();

  factory ImRemoteImageCacheManager() {
    return _instance;
  }

  ImRemoteImageCacheManager._()
      : super(
          Config(
            kCacheFullImagesKey,
            stalePeriod: const Duration(days: kCacheStalePeriod),
            maxNrOfCacheObjects: kCacheMaxNrOfFullImages,
          ),
        );
}
