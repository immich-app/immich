import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

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
