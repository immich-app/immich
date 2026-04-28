import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

final appSettingsServiceProvider = Provider((_) => const AppSettingsService());

final appSettingStreamProvider = StreamProvider.family.autoDispose<bool, AppSettingsEnum<bool>>((ref, setting) {
  final service = ref.watch(appSettingsServiceProvider);
  return service.watchSetting(setting);
});
