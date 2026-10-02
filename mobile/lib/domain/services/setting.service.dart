import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/services/store.service.dart';

class SettingsService {
  final StoreService _storeService;

  const SettingsService({required this._storeService});

  T get<T>(Setting<T> setting) => _storeService.get(setting.storeKey, setting.defaultValue);
}
