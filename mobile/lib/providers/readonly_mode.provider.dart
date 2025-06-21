import 'package:riverpod_annotation/riverpod_annotation.dart';

import 'package:immich_mobile/services/app_settings.service.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';

part 'readonly_mode.provider.g.dart';

@riverpod
class ReadonlyMode extends _$ReadonlyMode {
  @override
  bool build() {
    final readonlyMode = ref.read(appSettingsServiceProvider).getSetting(
          AppSettingsEnum.readonlyModeEnabled,
        );
    return readonlyMode;
  }

  void setReadonlyMode(bool isEnabled) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.readonlyModeEnabled,
          isEnabled,
        );
    state = isEnabled;
  }

  void toggleReadonlyMode(bool newState) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.readonlyModeEnabled,
          newState,
        );
    state = newState;
  }
}
