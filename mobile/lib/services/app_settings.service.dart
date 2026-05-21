import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';

enum AppSettingsEnum<T> {
  advancedTroubleshooting<bool>(StoreKey.advancedTroubleshooting, null, false),
  manageLocalMediaAndroid<bool>(StoreKey.manageLocalMediaAndroid, null, false),
  reviewOutOfSyncChangesAndroid<bool>(StoreKey.reviewOutOfSyncChangesAndroid, null, false),
  enableHapticFeedback<bool>(StoreKey.enableHapticFeedback, null, true),
  readonlyModeEnabled<bool>(StoreKey.readonlyModeEnabled, "readonlyModeEnabled", false);

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

  Stream<T> watchSetting<T>(AppSettingsEnum<T> setting) async* {
    yield getSetting<T>(setting);
    await for (final dynamic value in Store.watch(setting.storeKey)) {
      yield (value as T?) ?? setting.defaultValue;
    }
  }
}
