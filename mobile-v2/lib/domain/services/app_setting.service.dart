import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/app_setting.model.dart';

class AppSettingService {
  final IStoreRepository store;

  const AppSettingService(this.store);

  Future<T> getSetting<T>(AppSetting<T> setting) async {
    final value = await store.tryGet(setting.storeKey);
    return value ?? setting.defaultValue;
  }

  Future<bool> setSetting<T>(AppSetting<T> setting, T value) async {
    return await store.set(setting.storeKey, value);
  }

  Stream<T> watchSetting<T>(AppSetting<T> setting) {
    return store
        .watch(setting.storeKey)
        .map((value) => value ?? setting.defaultValue);
  }
}
