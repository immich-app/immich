import 'package:immich_mobile/entities/store.entity.dart';

enum AppSettingsEnum<T> {
  loadPreview<bool>(StoreKey.loadPreview, "loadPreview", true),
  loadOriginal<bool>(StoreKey.loadOriginal, "loadOriginal", false),
  themeMode<String>(
    StoreKey.themeMode,
    "themeMode",
    "system",
  ), // "light","dark","system"
  tilesPerRow<int>(StoreKey.tilesPerRow, "tilesPerRow", 4),
  dynamicLayout<bool>(StoreKey.dynamicLayout, "dynamicLayout", false),
  groupAssetsBy<int>(StoreKey.groupAssetsBy, "groupBy", 0),
  uploadErrorNotificationGracePeriod<int>(
    StoreKey.uploadErrorNotificationGracePeriod,
    "uploadErrorNotificationGracePeriod",
    2,
  ),
  backgroundBackupTotalProgress<bool>(
    StoreKey.backgroundBackupTotalProgress,
    "backgroundBackupTotalProgress",
    true,
  ),
  backgroundBackupSingleProgress<bool>(
    StoreKey.backgroundBackupSingleProgress,
    "backgroundBackupSingleProgress",
    false,
  ),
  storageIndicator<bool>(StoreKey.storageIndicator, "storageIndicator", true),
  thumbnailCacheSize<int>(
    StoreKey.thumbnailCacheSize,
    "thumbnailCacheSize",
    10000,
  ),
  imageCacheSize<int>(StoreKey.imageCacheSize, "imageCacheSize", 350),
  albumThumbnailCacheSize<int>(
    StoreKey.albumThumbnailCacheSize,
    "albumThumbnailCacheSize",
    200,
  ),
  selectedAlbumSortOrder<int>(
    StoreKey.selectedAlbumSortOrder,
    "selectedAlbumSortOrder",
    0,
  ),
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, null, false),
  logLevel<int>(StoreKey.logLevel, null, 5), // Level.INFO = 5
  preferRemoteImage<bool>(StoreKey.preferRemoteImage, null, false),
  loopVideo<bool>(StoreKey.loopVideo, "loopVideo", true),
  mapThemeMode<int>(StoreKey.mapThemeMode, null, 0),
  mapShowFavoriteOnly<bool>(StoreKey.mapShowFavoriteOnly, null, false),
  mapIncludeArchived<bool>(StoreKey.mapIncludeArchived, null, false),
  mapwithPartners<bool>(StoreKey.mapwithPartners, null, false),
  mapRelativeDate<int>(StoreKey.mapRelativeDate, null, 0),
  allowSelfSignedSSLCert<bool>(StoreKey.selfSignedCert, null, false),
  ignoreIcloudAssets<bool>(StoreKey.ignoreIcloudAssets, null, false),
  selectedAlbumSortReverse<bool>(
    StoreKey.selectedAlbumSortReverse,
    null,
    false,
  ),
  enableHapticFeedback<bool>(StoreKey.enableHapticFeedback, null, true),
  ;

  const AppSettingsEnum(this.storeKey, this.hiveKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final String? hiveKey;
  final T defaultValue;
}

class AppSettingsService {
  T getSetting<T>(AppSettingsEnum<T> setting) {
    return Store.get(setting.storeKey, setting.defaultValue);
  }

  void setSetting<T>(AppSettingsEnum<T> setting, T value) {
    Store.put(setting.storeKey, value);
  }
}
