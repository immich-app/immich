import 'package:immich_mobile/modules/backup/background_service/background.service.dart';
import 'package:immich_mobile/modules/backup/models/backup_setting.model.dart';
import 'package:immich_mobile/shared/models/store.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

part 'backup_settings.provider.g.dart';

@riverpod
class BackupSettings extends _$BackupSettings {
  @override
  BackupSetting build() {
    return BackupSetting(
      autoBackup: Store.get(StoreKey.autoBackup, false),
      backgroundBackup: Store.get(StoreKey.backgroundBackup, false),
      backupRequireWifi: Store.get(StoreKey.backupRequireWifi, true),
      backupRequireCharging: Store.get(StoreKey.backupRequireCharging, false),
      backupTriggerDelay: Store.get(StoreKey.backupTriggerDelay, 5000),
    );
  }

  void setAutoBackup(bool enabled) {
    Store.put(StoreKey.autoBackup, enabled);
    state = state.copyWith(autoBackup: enabled);
  }

  void configureBackgroundBackup({
    bool? enabled,
    bool? requireWifi,
    bool? requireCharging,
    int? triggerDelay,
    required void Function(String msg) onError,
    required void Function() onBatteryInfo,
  }) async {
    assert(
      enabled != null ||
          requireWifi != null ||
          requireCharging != null ||
          triggerDelay != null,
    );
    final backgroundService = ref.read(backgroundServiceProvider);

    final bool wasEnabled = state.backgroundBackup;
    final bool wasWifi = state.backupRequireWifi;
    final bool wasCharging = state.backupRequireCharging;
    final int oldTriggerDelay = state.backupTriggerDelay;
    state = state.copyWith(
      backgroundBackup: enabled,
      backupRequireWifi: requireWifi,
      backupRequireCharging: requireCharging,
      backupTriggerDelay: triggerDelay,
    );

    if (state.backgroundBackup) {
      bool success = true;
      if (!wasEnabled) {
        if (!await backgroundService.isIgnoringBatteryOptimizations()) {
          onBatteryInfo();
        }
        success &= await backgroundService.enableService(immediate: true);
      }
      success &= success &&
          await backgroundService.configureService(
            requireUnmetered: state.backupRequireWifi,
            requireCharging: state.backupRequireCharging,
            triggerUpdateDelay: state.backupTriggerDelay,
            triggerMaxDelay: state.backupTriggerDelay * 10,
          );
      if (success) {
        await Store.put(StoreKey.backupRequireWifi, state.backupRequireWifi);
        await Store.put(
          StoreKey.backupRequireCharging,
          state.backupRequireCharging,
        );
        await Store.put(StoreKey.backupTriggerDelay, state.backupTriggerDelay);
        await Store.put(StoreKey.backgroundBackup, state.backgroundBackup);
      } else {
        state = state.copyWith(
          backgroundBackup: wasEnabled,
          backupRequireWifi: wasWifi,
          backupRequireCharging: wasCharging,
          backupTriggerDelay: oldTriggerDelay,
        );
        onError("backup_controller_page_background_configure_error");
      }
    } else {
      final bool success = await backgroundService.disableService();
      if (!success) {
        state = state.copyWith(backgroundBackup: wasEnabled);
        onError("backup_controller_page_background_configure_error");
      }
    }
  }
}
