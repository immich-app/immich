import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/app_settings.provider.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/routing/router.dart';
import 'package:immich_mobile/services/app_settings.service.dart';

class ReadOnlyModeNotifier extends Notifier<bool> {
  late AppSettingsService _appSettingService;

  @override
  bool build() {
    _appSettingService = ref.read(appSettingsServiceProvider);
    final readonlyMode = _appSettingService.getSetting(AppSettingsEnum.readonlyModeEnabled);
    return readonlyMode;
  }

  void setMode(bool value) {
    final isLoggedIn = ref.read(authProvider).isAuthenticated;
    _appSettingService.setSetting(AppSettingsEnum.readonlyModeEnabled, value);
    state = value;

    if (value && isLoggedIn) {
      ref.read(appRouterProvider).navigate(const MainTimelineRoute());
    }
  }

  void setReadonlyMode(bool isEnabled) {
    state = isEnabled;
    setMode(state);
  }

  void toggleReadonlyMode() {
    state = !state;
    setMode(state);
  }
}

final readonlyModeProvider = NotifierProvider<ReadOnlyModeNotifier, bool>(() => ReadOnlyModeNotifier());
