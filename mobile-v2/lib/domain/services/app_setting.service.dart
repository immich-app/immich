import 'package:immich_mobile/domain/models/app_setting.model.dart';
import 'package:immich_mobile/domain/store_manager.dart';

class AppSettingService {
  final StoreManager store;

  const AppSettingService(this.store);

  T getSetting<T>(AppSetting<T> setting) {
    return store.get(setting.storeKey, setting.defaultValue);
  }

  Future<bool> setSetting<T>(AppSetting<T> setting, T value) async {
    return await store.put(setting.storeKey, value);
  }

  Stream<T> watchSetting<T>(AppSetting<T> setting) {
    return store
        .watch(setting.storeKey)
        .map((value) => value ?? setting.defaultValue);
  }
}
