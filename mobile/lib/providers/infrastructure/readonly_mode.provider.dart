import 'dart:async';

import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/providers/auth.provider.dart';
import 'package:immich_mobile/providers/infrastructure/settings.provider.dart';
import 'package:immich_mobile/routing/router.dart';

class ReadOnlyModeNotifier extends Notifier<bool> {
  @override
  bool build() {
    return ref.read(appConfigProvider).advanced.readonlyModeEnabled;
  }

  void setMode(bool value) {
    final isLoggedIn = ref.read(authProvider).isAuthenticated;
    unawaited(ref.read(settingsProvider).write(.advancedReadonlyModeEnabled, value));
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
