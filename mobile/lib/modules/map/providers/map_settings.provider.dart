import 'package:flutter/foundation.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';
import 'package:immich_mobile/modules/map/models/map_state.model.dart';
import 'package:immich_mobile/modules/settings/providers/app_settings.provider.dart';
import 'package:immich_mobile/modules/settings/services/app_settings.service.dart';

class MapSettingsStateNotifier extends StateNotifier<MapSettingsState> {
  MapSettingsStateNotifier(this.appSettingsProvider)
      : super(
          MapSettingsState(
            isDarkTheme: appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapThemeMode),
            showFavoriteOnly: appSettingsProvider
                .getSetting<bool>(AppSettingsEnum.mapShowFavoriteOnly),
          ),
        );

  final AppSettingsService appSettingsProvider;

  bool isDarkTheme() => state.isDarkTheme;

  void switchTheme(bool isDarkTheme) {
    state = state.copyWith(isDarkTheme: isDarkTheme);
    debugPrint("[DEBUGGGGG] Theme switched to $isDarkTheme");
  }

  void switchFavoriteOnly(bool isFavoriteOnly) =>
      state = state.copyWith(showFavoriteOnly: isFavoriteOnly);
}

final mapSettingsStateNotifier =
    StateNotifierProvider<MapSettingsStateNotifier, MapSettingsState>((ref) {
  return MapSettingsStateNotifier(ref.watch(appSettingsServiceProvider));
});
