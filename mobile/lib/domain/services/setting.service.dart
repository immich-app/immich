import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

// Singleton instance of SettingsService, to use in places
// where reactivity is not required
// ignore: non_constant_identifier_names
final AppSetting = SettingsService(storeService: StoreService.I);

class SettingsService {
  final StoreService _storeService;

  const SettingsService({required StoreService storeService})
      : _storeService = storeService;

  T get<T>(Setting<T> setting) =>
      _storeService.get(setting.storeKey, setting.defaultValue);

  Future<void> set<T>(Setting<T> setting, T value) =>
      _storeService.put(setting.storeKey, value);

  Stream<T> watch<T>(Setting<T> setting) => _storeService
      .watch(setting.storeKey)
      .map((v) => v ?? setting.defaultValue);
}
