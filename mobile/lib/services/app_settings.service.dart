import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';

enum AppSettingsEnum<T> {
  selectedAlbumSortOrder<int>(StoreKey.selectedAlbumSortOrder, "selectedAlbumSortOrder", 2),
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, null, false),
  manageLocalMediaAndroid<bool>(StoreKey.manageLocalMediaAndroid, null, false),
  selectedAlbumSortReverse<bool>(StoreKey.selectedAlbumSortReverse, null, true),
  enableHapticFeedback<bool>(StoreKey.enableHapticFeedback, null, true),
  syncAlbums<bool>(StoreKey.syncAlbums, null, false),
  enableBackup<bool>(StoreKey.enableBackup, null, false),
  useCellularForUploadVideos<bool>(StoreKey.useWifiForUploadVideos, null, false),
  useCellularForUploadPhotos<bool>(StoreKey.useWifiForUploadPhotos, null, false),
  readonlyModeEnabled<bool>(StoreKey.readonlyModeEnabled, "readonlyModeEnabled", false),
  albumGridView<bool>(StoreKey.albumGridView, "albumGridView", false),
  backupRequireCharging<bool>(StoreKey.backupRequireCharging, null, false),
  backupTriggerDelay<int>(StoreKey.backupTriggerDelay, null, 30);

  const AppSettingsEnum(this.storeKey, this.hiveKey, this.defaultValue);

  final StoreKey<T> storeKey;
  final String? hiveKey;
  final T defaultValue;
}

class AppSettingsService {
  const AppSettingsService();
  T getSetting<T>(AppSettingsEnum<T> setting) {
    return Store.get(setting.storeKey, setting.defaultValue);
  }

  Future<void> setSetting<T>(AppSettingsEnum<T> setting, T value) {
    return Store.put(setting.storeKey, value);
  }
}
