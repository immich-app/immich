import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/domain/models/store.model.dart';
import 'package:immich_mobile/entities/store.entity.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

final backupSettingsProvider = Provider<BackupSettingsController>(
  (ref) => BackupSettingsController(ref.watch(appSettingsServiceProvider)),
);

final backupCutoffDateEnabledProvider = StreamProvider<bool>((ref) async* {
  yield Store.get(StoreKey.backupCutoffDateEnabled, AppSettingsEnum.backupCutoffDateEnabled.defaultValue);
  yield* Store.watch(
    StoreKey.backupCutoffDateEnabled,
  ).map((value) => value ?? AppSettingsEnum.backupCutoffDateEnabled.defaultValue);
});

final backupCutoffDateMsProvider = StreamProvider<int>((ref) async* {
  yield Store.get(StoreKey.backupCutoffDate, AppSettingsEnum.backupCutoffDate.defaultValue);
  yield* Store.watch(StoreKey.backupCutoffDate).map((value) => value ?? AppSettingsEnum.backupCutoffDate.defaultValue);
});

final backupEffectiveCutoffDateProvider = Provider<DateTime?>((ref) {
  final enabled = ref.watch(backupCutoffDateEnabledProvider).value ?? false;
  final cutoffDateMs = ref.watch(backupCutoffDateMsProvider).value ?? 0;

  if (!enabled) {
    return null;
  }

  return DateTime.fromMillisecondsSinceEpoch(cutoffDateMs, isUtc: true);
});

class BackupSettingsController {
  final AppSettingsService _appSettings;

  const BackupSettingsController(this._appSettings);

  Future<void> setCutoffDateEnabled(bool enabled) {
    return _appSettings.setSetting(AppSettingsEnum.backupCutoffDateEnabled, enabled);
  }

  Future<void> setCutoffDateUtc(DateTime date) {
    final normalizedUtc = DateTime.utc(date.year, date.month, date.day);
    return _appSettings.setSetting(AppSettingsEnum.backupCutoffDate, normalizedUtc.millisecondsSinceEpoch);
  }
}
