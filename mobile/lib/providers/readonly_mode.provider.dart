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

  void setMode(bool value) {
    ref.read(appSettingsServiceProvider).setSetting(
          AppSettingsEnum.readonlyModeEnabled,
          value,
        );
  }

  void setReadonlyMode(bool isEnabled) {
    setMode(isEnabled);
    state = isEnabled;
  }

  void toggleReadonlyMode(bool newState) {
    setMode(newState);
    state = newState;
  }
}
