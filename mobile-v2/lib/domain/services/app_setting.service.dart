import 'package:immich_mobile/domain/interfaces/store.interface.dart';
import 'package:immich_mobile/domain/models/app_setting.model.dart';

class AppSettingService {
  final IStoreRepository _store;

  const AppSettingService(this._store);

  Future<T> get<T>(AppSetting<T> setting) async {
    final value = await _store.tryGet(setting.storeKey);
    return value ?? setting.defaultValue;
  }

  Future<bool> upsert<T>(AppSetting<T> setting, T value) async {
    return await _store.upsert(setting.storeKey, value);
  }

  Stream<T> watch<T>(AppSetting<T> setting) {
    return _store
        .watch(setting.storeKey)
        .map((value) => value ?? setting.defaultValue);
  }
}
