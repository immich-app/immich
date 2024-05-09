import 'package:immich_mobile/domain/models/app_setting.model.dart';
import 'package:immich_mobile/domain/store_manager.dart';

class AppSettingsService {
  final StoreManager store;

  const AppSettingsService(this.store);

  T getSetting<T>(AppSettings<T> setting) {
    return store.get(setting.storeKey, setting.defaultValue);
  }

  void setSetting<T>(AppSettings<T> setting, T value) {
    store.put(setting.storeKey, value);
  }

  Stream<T> watchSetting<T>(AppSettings<T> setting) {
    return store
        .watch<T>(setting.storeKey)
        .map((value) => value ?? setting.defaultValue);
  }
}
