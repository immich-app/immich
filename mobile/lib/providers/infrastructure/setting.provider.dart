import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/setting.model.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/domain/services/setting.service.dart';
import 'package:immich_mobile/providers/infrastructure/store.provider.dart';

class SettingsNotifier extends Notifier<SettingsService> {
  @override
  SettingsService build() => SettingsService(storeService: ref.read(storeServiceProvider));

  T get<T>(Setting<T> setting) => state.get(setting);

  Future<void> set<T>(Setting<T> setting, T value) async {
    await state.set(setting, value);
    ref.invalidateSelf();
  }

  Stream<T> watch<T>(Setting<T> setting) => state.watch(setting);
}

final settingsProvider = NotifierProvider<SettingsNotifier, SettingsService>(SettingsNotifier.new);

final timelineDynamicLayoutThresholdProvider = StreamProvider<int?>((ref) {
  final store = ref.watch(storeServiceProvider);
  return store.watch(StoreKey.timelineDynamicLayoutThreshold);
}, dependencies: [storeServiceProvider]);
